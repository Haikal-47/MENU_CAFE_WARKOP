export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface CafeTable {
  id: string;
  tableNumber: string;
  qrToken: string;
  locationNote?: string | null;
  isActive: boolean;
}

export type OrderStatus = 'menunggu' | 'diproses' | 'siap_diantar' | 'selesai' | 'dibatalkan';
export type PaymentMethod = 'cash' | 'qris';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface OrderItemSnapshot {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableNumber: string;
  locationNote?: string | null;
  customerName?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemSnapshot[];
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'cashier';
}
