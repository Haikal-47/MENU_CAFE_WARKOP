import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah, formatDateTime, formatTimeOnly } from '../../utils/formatters';
import { OrderBadge, PaymentBadge } from '../../components/common/Badge';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  QrCode,
  Banknote,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        setError('Gagal memuat data dashboard.');
      }
    } catch {
      setError('Koneksi server bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 8000); // 8-second refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#69574A]">Memuat metrik warkop...</p>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Ringkasan Operasional Hari Ini
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Dashboard Kasir & Barista
          </h1>
        </div>

        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFCF7] text-xs font-medium text-[#34241C] border border-[#D8C9B7] hover:bg-[#E5D8C7] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#896A50]" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
          <div className="flex items-center justify-between text-[#896A50] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendapatan Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F2EA] text-[#3D784E] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#34241C]">
            {formatRupiah(m.todayTotalRevenue || 0)}
          </div>
          <span className="text-[11px] text-[#69574A] mt-1 block">
            Berdasarkan pesanan lunas hari ini
          </span>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
          <div className="flex items-center justify-between text-[#896A50] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan Masuk</span>
            <div className="w-8 h-8 rounded-lg bg-[#F5EFE5] text-[#896A50] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#34241C]">
            {m.todayTotalOrders || 0}
          </div>
          <span className="text-[11px] text-[#69574A] mt-1 block">
            Semua pesanan tercatat di sistem
          </span>
        </div>

        {/* Needs Action (Menunggu) */}
        <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
          <div className="flex items-center justify-between text-[#896A50] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Perlu Dikonfirmasi</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF3E5] text-[#C67D26] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#C67D26]">
            {m.waitingOrdersCount || 0}
          </div>
          <span className="text-[11px] text-[#69574A] mt-1 block">
            Pesanan baru belum diproses
          </span>
        </div>

        {/* Brewing / In Process */}
        <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
          <div className="flex items-center justify-between text-[#896A50] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sedang Diracik Barista</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF2F7] text-[#3F647E] flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#3F647E]">
            {m.processingOrdersCount || 0}
          </div>
          <span className="text-[11px] text-[#69574A] mt-1 block">
            Sedang disiapkan di bar / dapur
          </span>
        </div>
      </div>

      {/* Secondary Status Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#FDF3E5] border border-[#F0CBA0] flex items-center justify-between">
          <span className="text-xs font-medium text-[#C67D26]">Menunggu Pembayaran</span>
          <span className="font-serif text-base font-bold text-[#C67D26]">{m.pendingPaymentCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#EFE8FA] border border-[#D4C3EC] flex items-center justify-between">
          <span className="text-xs font-medium text-[#6C4299]">Siap Diantar</span>
          <span className="font-serif text-base font-bold text-[#6C4299]">{m.readyOrdersCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#E8F2EA] border border-[#B8D8BF] flex items-center justify-between col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-[#3D784E]">Pesanan Selesai</span>
          <span className="font-serif text-base font-bold text-[#3D784E]">{m.completedOrdersCount || 0}</span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#D8C9B7] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#34241C]">
              Pesanan Masuk Terkini
            </h2>
            <p className="text-xs text-[#69574A]">
              10 pesanan terbaru yang masuk dari meja pelanggan
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-[#896A50] hover:text-[#34241C]"
          >
            <span>Buka Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE5] text-[#69574A] uppercase tracking-wider font-semibold border-b border-[#D8C9B7]">
              <tr>
                <th className="py-3 px-4">No. Pesanan</th>
                <th className="py-3 px-4">Meja</th>
                <th className="py-3 px-4">Menu & Kuantitas</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Metode & Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C9B7]/50 text-[#34241C]">
              {data?.recentOrders?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#69574A]">
                    Belum ada pesanan yang masuk hari ini.
                  </td>
                </tr>
              ) : (
                data?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#F5EFE5]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <Link
                        to={`/admin/orders`}
                        className="text-[#34241C] hover:text-[#896A50] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      {order.customerName && (
                        <span className="block text-[11px] text-[#69574A] font-sans">
                          {order.customerName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded bg-[#E5D8C7] text-[#34241C] font-semibold">
                        Meja {order.tableNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="text-xs truncate">
                            <strong>{item.quantity}×</strong> {item.productName}
                            {item.notes && (
                              <span className="text-[10px] text-[#896A50] italic block ml-3">
                                • {item.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold whitespace-nowrap">
                      {formatRupiah(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#69574A]">
                          {order.paymentMethod === 'qris' ? (
                            <QrCode className="w-3 h-3 text-[#896A50]" />
                          ) : (
                            <Banknote className="w-3 h-3 text-[#896A50]" />
                          )}
                          {order.paymentMethod.toUpperCase()}
                        </span>
                        <PaymentBadge status={order.paymentStatus} size="sm" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <OrderBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-[#69574A] whitespace-nowrap">
                      {formatTimeOnly(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
