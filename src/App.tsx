import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Customer Pages
import { MenuPage } from './pages/customer/MenuPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderStatusPage } from './pages/customer/OrderStatusPage';

// Admin Pages
import { LoginPage } from './pages/admin/LoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { TablesPage } from './pages/admin/TablesPage';
import { ReportsPage } from './pages/admin/ReportsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Facing Routes */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/t/:token" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderNumber" element={<OrderStatusPage />} />

            {/* Admin / Cashier Authentication */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
