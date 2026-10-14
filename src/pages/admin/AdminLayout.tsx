import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Coffee,
  Layers,
  QrCode,
  BarChart3,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  // Periodic poll for active orders counter badge
  useEffect(() => {
    if (!user) return;

    const checkActiveOrders = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          const waiting = data.metrics?.waitingOrdersCount || 0;
          const processing = data.metrics?.processingOrdersCount || 0;
          setActiveOrdersCount(waiting + processing);
        }
      } catch {
        // quiet error on badge poll
      }
    };

    checkActiveOrders();
    const interval = setInterval(checkActiveOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#69574A]">Memverifikasi sesi kasir...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    {
      to: '/admin/orders',
      label: 'Manajemen Pesanan',
      icon: ClipboardList,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    { to: '/admin/products', label: 'Kelola Produk', icon: Coffee },
    { to: '/admin/categories', label: 'Kategori Menu', icon: Layers },
    { to: '/admin/tables', label: 'Meja & QR Code', icon: QrCode },
    { to: '/admin/reports', label: 'Laporan Penjualan', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F5EFE5] flex flex-col md:flex-row text-[#34241C]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#34241C] text-[#E5D8C7] border-r border-[#896A50]/30 shrink-0 select-none">
        {/* Brand */}
        <div className="p-6 border-b border-[#896A50]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#896A50] text-[#FFFCF7] flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-[#FFFCF7] block leading-tight">
                SEDOH KOPI
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#E5D8C7]/70">
                Sistem Kasir & Dapur
              </span>
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div className="px-6 py-4 bg-black/20 border-b border-[#896A50]/30 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#896A50] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#FFFCF7] block truncate">
                {user.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#E5D8C7]/70 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#C67D26]" />
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#896A50] text-[#FFFCF7] font-semibold shadow-xs'
                    : 'text-[#E5D8C7] hover:bg-white/10 hover:text-[#FFFCF7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-[#C67D26] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#896A50]/30 space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#E5D8C7]/80 hover:text-[#FFFCF7] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Menu Pelanggan</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E5D8C7]/80 hover:text-[#B83E3E] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>

      {/* Top Header for Mobile */}
      <div className="md:hidden bg-[#34241C] text-[#E5D8C7] p-4 flex items-center justify-between border-b border-[#896A50]/30">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-[#E5D8C7]" />
          <span className="font-serif text-base font-bold text-[#FFFCF7]">
            SEDOH KOPI KASIR
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-[#E5D8C7] hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#34241C] text-[#E5D8C7] border-b border-[#896A50]/30 p-4 space-y-1">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                  isActive ? 'bg-[#896A50] text-[#FFFCF7]' : 'text-[#E5D8C7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-[#C67D26] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#896A50]/30 flex items-center justify-between text-xs">
            <span className="text-xs text-[#E5D8C7]/70">{user.name} ({user.role})</span>
            <button
              onClick={handleLogout}
              className="text-[#E5D8C7] hover:text-[#B83E3E] font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
