import { Router } from 'express';
import { z } from 'zod';
import { db, orders, orderItems, products, categories, cafeTables } from '../db';
import { eq, desc, asc, and, sql, gte } from 'drizzle-orm';
import { requireAuth } from '../utils/auth';
import crypto from 'crypto';

const router = Router();

// Protect all admin endpoints with authentication
router.use(requireAuth);

// ----------------------------------------------------
// 1. DASHBOARD OVERVIEW
// ----------------------------------------------------
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Metric 1: Today's Orders & Revenue
    const todayOrders = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(gte(orders.createdAt, today));

    const todayTotalRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const pendingPaymentCount = todayOrders.filter((o) => o.paymentStatus === 'pending').length;
    const waitingOrdersCount = todayOrders.filter((o) => o.status === 'menunggu').length;
    const processingOrdersCount = todayOrders.filter((o) => o.status === 'diproses').length;
    const readyOrdersCount = todayOrders.filter((o) => o.status === 'siap_diantar').length;
    const completedOrdersCount = todayOrders.filter((o) => o.status === 'selesai').length;

    // Recent Active Orders (latest 10)
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        tableNumber: cafeTables.tableNumber,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(cafeTables, eq(orders.tableId, cafeTables.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Fetch items for recent orders
    const orderIds = recentOrders.map((o) => o.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const items = await db
        .select()
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN ${orderIds}`);

      itemsMap = items.reduce((acc, item) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push(item);
        return acc;
      }, {} as Record<string, any[]>);
    }

    const recentWithItems = recentOrders.map((o) => ({
      ...o,
      items: itemsMap[o.id] || [],
    }));

    res.json({
      metrics: {
        todayTotalRevenue,
        todayTotalOrders: todayOrders.length,
        pendingPaymentCount,
        waitingOrdersCount,
        processingOrdersCount,
        readyOrdersCount,
        completedOrdersCount,
      },
      recentOrders: recentWithItems,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Gagal memuat ringkasan dashboard.' });
  }
});

// ----------------------------------------------------
// 2. ORDER MANAGEMENT
// ----------------------------------------------------
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, limit = '50' } = req.query;

    let query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        tableNumber: cafeTables.tableNumber,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(cafeTables, eq(orders.tableId, cafeTables.id))
      .orderBy(desc(orders.createdAt))
      .limit(parseInt(limit as string, 10));

    const allOrders = await query;

    // Filter in-memory if query params passed
    let filtered = allOrders;
    if (status && status !== 'all') {
      filtered = filtered.filter((o) => o.status === status);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      filtered = filtered.filter((o) => o.paymentMethod === paymentMethod);
    }

    const orderIds = filtered.map((o) => o.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const items = await db
        .select()
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN ${orderIds}`);

      itemsMap = items.reduce((acc, item) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push(item);
        return acc;
      }, {} as Record<string, any[]>);
    }

    const ordersWithItems = filtered.map((o) => ({
      ...o,
      items: itemsMap[o.id] || [],
    }));

    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar pesanan.' });
  }
});

// Update Order Status
const updateStatusSchema = z.object({
  status: z.enum(['menunggu', 'diproses', 'siap_diantar', 'selesai', 'dibatalkan']),
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { status: newStatus } = parseResult.data;

    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!currentOrder) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }

    // Status transition validation rules
    const validTransitions: Record<string, string[]> = {
      menunggu: ['diproses', 'dibatalkan'],
      diproses: ['siap_diantar', 'dibatalkan'],
      siap_diantar: ['selesai', 'dibatalkan'],
      selesai: [],
      dibatalkan: [],
    };

    const allowed = validTransitions[currentOrder.status];
    if (!allowed || (!allowed.includes(newStatus) && currentOrder.status !== newStatus)) {
      res.status(400).json({
        error: `Perubahan status tidak diizinkan: dari "${currentOrder.status}" ke "${newStatus}".`,
      });
      return;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status pesanan.' });
  }
});

// Confirm/Update Payment Status
const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']),
});

router.patch('/orders/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updatePaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { paymentStatus } = parseResult.data;

    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status pembayaran.' });
  }
});

// ----------------------------------------------------
// 3. PRODUCT MANAGEMENT
// ----------------------------------------------------
const productInputSchema = z.object({
  categoryId: z.string().uuid('Kategori tidak valid'),
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  description: z.string().default(''),
  price: z.number().int().positive('Harga harus berupa angka bulat positif'),
  imageUrl: z.string().min(1, 'URL foto produk diperlukan'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

router.get('/products', async (req, res) => {
  try {
    const allProducts = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        isAvailable: products.isAvailable,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(categories.name), asc(products.name));

    res.json({ products: allProducts });
  } catch (error) {
    console.error('Fetch admin products error:', error);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const parseResult = productInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const [newProduct] = await db
      .insert(products)
      .values(parseResult.data)
      .returning();

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk baru.' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = productInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...parseResult.data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data produk.' });
  }
});

router.patch('/products/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const [curr] = await db
      .select({ isAvailable: products.isAvailable })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!curr) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }

    const [updated] = await db
      .update(products)
      .set({
        isAvailable: !curr.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    res.json({ success: true, isAvailable: updated.isAvailable });
  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({ error: 'Gagal mengubah status ketersediaan.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if referenced in order_items
    const refCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderItems)
      .where(eq(orderItems.productId, id));

    if (Number(refCount[0]?.count) > 0) {
      // Soft-deactivate to protect order snapshot integrity
      await db
        .update(products)
        .set({ isAvailable: false, updatedAt: new Date() })
        .where(eq(products.id, id));

      res.json({
        success: true,
        message: 'Produk memiliki riwayat pesanan, sehingga dinonaktifkan dari menu agar histori tetap utuh.',
      });
      return;
    }

    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Gagal menghapus produk.' });
  }
});

// ----------------------------------------------------
// 4. CATEGORIES MANAGEMENT
// ----------------------------------------------------
const categorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  slug: z.string().min(2, 'Slug minimal 2 karakter'),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.get('/categories', async (req, res) => {
  try {
    const allCats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    res.json({ categories: allCats });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Gagal memuat kategori.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const parseResult = categorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const [newCat] = await db
      .insert(categories)
      .values(parseResult.data)
      .returning();

    res.status(201).json({ success: true, category: newCat });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Gagal menambahkan kategori baru.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = categorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...parseResult.data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    res.json({ success: true, category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Gagal memperbarui kategori.' });
  }
});

// ----------------------------------------------------
// 5. CAFE TABLES & QR CODE MANAGEMENT
// ----------------------------------------------------
const tableSchema = z.object({
  tableNumber: z.string().min(1, 'Nomor meja diperlukan'),
  locationNote: z.string().optional(),
  isActive: z.boolean().default(true),
});

function generateSecureQrToken(tableNumber: string): string {
  const salt = crypto.randomBytes(4).toString('hex');
  const cleanNum = tableNumber.replace(/\s+/g, '').toLowerCase();
  return `wrk_tbl_${cleanNum}_${salt}`;
}

router.get('/tables', async (req, res) => {
  try {
    const allTables = await db
      .select()
      .from(cafeTables)
      .orderBy(asc(cafeTables.tableNumber));

    res.json({ tables: allTables });
  } catch (error) {
    console.error('Fetch admin tables error:', error);
    res.status(500).json({ error: 'Gagal memuat data meja.' });
  }
});

router.post('/tables', async (req, res) => {
  try {
    const parseResult = tableSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { tableNumber, locationNote, isActive } = parseResult.data;
    const qrToken = generateSecureQrToken(tableNumber);

    const [newTable] = await db
      .insert(cafeTables)
      .values({
        tableNumber,
        locationNote: locationNote || null,
        qrToken,
        isActive,
      })
      .returning();

    res.status(201).json({ success: true, table: newTable });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Gagal menambahkan meja. Pastikan nomor meja belum terdaftar.' });
  }
});

router.put('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = tableSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const [updated] = await db
      .update(cafeTables)
      .set({
        tableNumber: parseResult.data.tableNumber,
        locationNote: parseResult.data.locationNote || null,
        isActive: parseResult.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(cafeTables.id, id))
      .returning();

    res.json({ success: true, table: updated });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data meja.' });
  }
});

router.post('/tables/:id/regenerate-token', async (req, res) => {
  try {
    const { id } = req.params;

    const [curr] = await db
      .select()
      .from(cafeTables)
      .where(eq(cafeTables.id, id))
      .limit(1);

    if (!curr) {
      res.status(404).json({ error: 'Meja tidak ditemukan.' });
      return;
    }

    const newToken = generateSecureQrToken(curr.tableNumber);

    const [updated] = await db
      .update(cafeTables)
      .set({
        qrToken: newToken,
        updatedAt: new Date(),
      })
      .where(eq(cafeTables.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Token QR baru berhasil dibuat. QR Code lama tidak berlaku lagi.',
      table: updated,
    });
  } catch (error) {
    console.error('Regenerate token error:', error);
    res.status(500).json({ error: 'Gagal memperbarui token QR meja.' });
  }
});

// ----------------------------------------------------
// 6. REPORTS & ANALYTICS
// ----------------------------------------------------
router.get('/reports', async (req, res) => {
  try {
    // 1. Overall totals
    const paidOrders = await db
      .select({
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'));

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCashRevenue = paidOrders
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalQrisRevenue = paidOrders
      .filter((o) => o.paymentMethod === 'qris')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Top products sold
    const topProducts = await db
      .select({
        productName: orderItems.productName,
        totalSold: sql<number>`sum(${orderItems.quantity})`,
        totalSales: sql<number>`sum(${orderItems.subtotal})`,
      })
      .from(orderItems)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(8);

    res.json({
      summary: {
        totalRevenue,
        totalOrdersCount: paidOrders.length,
        cashShare: totalRevenue > 0 ? Math.round((totalCashRevenue / totalRevenue) * 100) : 0,
        qrisShare: totalRevenue > 0 ? Math.round((totalQrisRevenue / totalRevenue) * 100) : 0,
        totalCashRevenue,
        totalQrisRevenue,
      },
      topProducts,
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Gagal memuat laporan penjualan.' });
  }
});

export default router;
