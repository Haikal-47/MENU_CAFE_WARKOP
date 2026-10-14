import { Router } from 'express';
import { db, categories, products, cafeTables } from '../db';
import { eq, asc } from 'drizzle-orm';

const router = Router();

// Get active menu categories and products
router.get('/', async (req, res) => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    const allProducts = await db
      .select()
      .from(products)
      .orderBy(asc(products.name));

    // Group products under categories
    const categoriesWithProducts = allCategories.map((cat) => {
      const items = allProducts.filter((p) => p.categoryId === cat.id);
      return {
        ...cat,
        products: items,
      };
    });

    res.json({
      categories: categoriesWithProducts,
      featuredProducts: allProducts.filter((p) => p.isFeatured && p.isAvailable),
    });
  } catch (error) {
    console.error('Fetch menu error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar menu.' });
  }
});

// Resolve table by QR token
router.get('/table/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [table] = await db
      .select({
        id: cafeTables.id,
        tableNumber: cafeTables.tableNumber,
        locationNote: cafeTables.locationNote,
        isActive: cafeTables.isActive,
      })
      .from(cafeTables)
      .where(eq(cafeTables.qrToken, token))
      .limit(1);

    if (!table) {
      res.status(404).json({ error: 'Meja tidak ditemukan atau kode QR tidak valid.' });
      return;
    }

    if (!table.isActive) {
      res.status(400).json({ error: 'Meja saat ini sedang dinonaktifkan atau dalam pemeliharaan.' });
      return;
    }

    res.json({ table });
  } catch (error) {
    console.error('Fetch table error:', error);
    res.status(500).json({ error: 'Gagal memverifikasi meja.' });
  }
});

// Get active tables list for fallback selection / demo
router.get('/tables', async (req, res) => {
  try {
    const tables = await db
      .select({
        id: cafeTables.id,
        tableNumber: cafeTables.tableNumber,
        qrToken: cafeTables.qrToken,
        locationNote: cafeTables.locationNote,
        isActive: cafeTables.isActive,
      })
      .from(cafeTables)
      .where(eq(cafeTables.isActive, true))
      .orderBy(asc(cafeTables.tableNumber));

    res.json({ tables });
  } catch (error) {
    console.error('Fetch tables error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar meja.' });
  }
});

export default router;
