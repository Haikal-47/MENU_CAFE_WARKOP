import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Admin Users Table
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('cashier'), // 'admin' | 'cashier'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description').notNull().default(''),
  price: integer('price').notNull(), // dalam rupiah (integer)
  imageUrl: text('image_url').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 4. Cafe Tables Table
export const cafeTables = pgTable('cafe_tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableNumber: varchar('table_number', { length: 20 }).notNull().unique(),
  qrToken: varchar('qr_token', { length: 64 }).notNull().unique(),
  locationNote: varchar('location_note', { length: 100 }), // e.g. "Lantai 1 - Depan Bar", "Area Smoking"
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5. Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique(),
  tableId: uuid('table_id').references(() => cafeTables.id, { onDelete: 'restrict' }).notNull(),
  customerName: varchar('customer_name', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('menunggu'), // 'menunggu' | 'diproses' | 'siap_diantar' | 'selesai' | 'dibatalkan'
  paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('cash'), // 'cash' | 'qris'
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'), // 'pending' | 'paid' | 'cancelled'
  totalAmount: integer('total_amount').notNull(), // dalam rupiah
  notes: text('notes'),
  idempotencyKey: varchar('idempotency_key', { length: 64 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 6. Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 150 }).notNull(), // snapshot
  unitPrice: integer('unit_price').notNull(), // snapshot
  quantity: integer('quantity').notNull(),
  subtotal: integer('subtotal').notNull(), // snapshot
  notes: text('notes'), // e.g. "less sugar", "tanpa es"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const cafeTablesRelations = relations(cafeTables, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(cafeTables, {
    fields: [orders.tableId],
    references: [cafeTables.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
