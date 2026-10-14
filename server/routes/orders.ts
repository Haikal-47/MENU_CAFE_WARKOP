import { Router } from 'express';
import { z } from 'zod';
import { db, orders, orderItems, products, cafeTables } from '../db';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

const checkoutItemSchema = z.object({
  productId: z.string().uuid('ID Produk tidak valid'),
  quantity: z.number().int().positive('Jumlah pesanan minimal 1'),
  notes: z.string().max(200, 'Catatan maksimal 200 karakter').optional(),
});

const checkoutSchema = z.object({
  tableToken: z.string().min(1, 'Token meja diperlukan'),
  customerName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash', 'qris'], {
    message: 'Metode pembayaran harus cash atau qris',
  }),
  idempotencyKey: z.string().optional(),
  items: z.array(checkoutItemSchema).min(1, 'Keranjang belanja tidak boleh kosong'),
});

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // e.g. 261014
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `WRK-${dateStr}-${randomStr}`;
}

// Create new customer order (Checkout)
router.post('/', async (req, res) => {
  try {
    const parseResult = checkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { tableToken, customerName, notes, paymentMethod, idempotencyKey, items } = parseResult.data;

    // Check idempotency if key provided
    if (idempotencyKey) {
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingOrder) {
        // Return existing order to avoid double charge/processing
        res.status(200).json({
          success: true,
          message: 'Pesanan sudah pernah dibuat sebelumnya (Idempotent)',
          order: {
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            totalAmount: existingOrder.totalAmount,
            status: existingOrder.status,
            paymentMethod: existingOrder.paymentMethod,
            paymentStatus: existingOrder.paymentStatus,
          },
        });
        return;
      }
    }

    // 1. Verify table status
    const [table] = await db
      .select()
      .from(cafeTables)
      .where(eq(cafeTables.qrToken, tableToken))
      .limit(1);

    if (!table) {
      res.status(404).json({ error: 'Meja tidak ditemukan atau kode QR tidak sah.' });
      return;
    }

    if (!table.isActive) {
      res.status(400).json({ error: 'Meja saat ini sedang tidak aktif. Silakan hubungi kasir warkop.' });
      return;
    }

    // 2. Fetch fresh products from DB to re-calculate prices and verify availability
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Check availability of each item
    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        res.status(400).json({ error: `Produk dengan ID ${item.productId} tidak ditemukan di menu.` });
        return;
      }
      if (!prod.isAvailable) {
        res.status(400).json({
          error: `Mohon maaf, menu "${prod.name}" saat ini sedang habis atau tidak tersedia.`,
        });
        return;
      }
    }

    // 3. Compute total safely on server
    let computedTotalAmount = 0;
    const preparedItems = items.map((item) => {
      const prod = productMap.get(item.productId)!;
      const unitPrice = prod.price;
      const subtotal = unitPrice * item.quantity;
      computedTotalAmount += subtotal;

      return {
        productId: prod.id,
        productName: prod.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
        notes: item.notes || null,
      };
    });

    const orderNumber = generateOrderNumber();

    // 4. Save order in Neon DB
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        tableId: table.id,
        customerName: customerName?.trim() || null,
        status: 'menunggu',
        paymentMethod,
        paymentStatus: 'pending',
        totalAmount: computedTotalAmount,
        notes: notes?.trim() || null,
        idempotencyKey: idempotencyKey || null,
      })
      .returning();

    // Insert order items
    await db.insert(orderItems).values(
      preparedItems.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes,
      }))
    );

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        tableNumber: table.tableNumber,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        createdAt: newOrder.createdAt,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Gagal memproses pesanan. Silakan coba sesaat lagi.' });
  }
});

// Get order details by order number for status tracking
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        tableId: orders.tableId,
        customerName: orders.customerName,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        tableNumber: cafeTables.tableNumber,
        locationNote: cafeTables.locationNote,
      })
      .from(orders)
      .innerJoin(cafeTables, eq(orders.tableId, cafeTables.id))
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }

    const items = await db
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        unitPrice: orderItems.unitPrice,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
        notes: orderItems.notes,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    res.json({
      order: {
        ...order,
        items,
      },
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ error: 'Gagal memuat status pesanan.' });
  }
});

export default router;
