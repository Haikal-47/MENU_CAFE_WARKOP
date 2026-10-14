import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatRupiah, formatDateTime, formatTimeOnly, getPaymentMethodLabel } from '../../utils/formatters';
import { OrderBadge, PaymentBadge } from '../../components/common/Badge';
import {
  Check,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Banknote,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  MapPin,
  Clock,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setError(null);
      } else {
        setError('Gagal memuat daftar pesanan.');
      }
    } catch {
      if (!isBackground) setError('Koneksi server bermasalah.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 5000); // 5s auto-polling
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      } else {
        alert(data.error || 'Gagal mengubah status.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleConfirmPayment = async (orderId: string, paymentStatus: PaymentStatus) => {
    const confirmMsg =
      paymentStatus === 'paid'
        ? 'Apakah Anda yakin dana pembayaran telah diterima/terverifikasi di mutasi merchant?'
        : 'Apakah Anda yakin ingin membatalkan status pembayaran?';

    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
        );
      } else {
        alert(data.error || 'Gagal memperbarui status pembayaran.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.tableNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName?.toLowerCase().includes(q) || false;
      return matchNum || matchTable || matchCustomer;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Live Order Dashboard
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Manajemen Pesanan
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFCF7] text-xs font-medium text-[#34241C] border border-[#D8C9B7] hover:bg-[#E5D8C7] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#896A50]" />
            <span>Polling Aktif (5d)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] p-4 rounded-2xl border border-[#D8C9B7] space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'menunggu', label: 'Menunggu' },
            { id: 'diproses', label: 'Sedang Diracik' },
            { id: 'siap_diantar', label: 'Siap Diantar' },
            { id: 'selesai', label: 'Selesai' },
            { id: 'dibatalkan', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#34241C] text-[#FFFCF7]'
                  : 'bg-[#F5EFE5] text-[#69574A] hover:bg-[#E5D8C7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Payment filter row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#D8C9B7]/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-[#896A50] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. pesanan, meja, atau nama..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-1 focus:ring-[#896A50]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-[#69574A]">Status Bayar:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
            >
              <option value="all">Semua</option>
              <option value="pending">Belum Bayar (Pending)</option>
              <option value="paid">Lunas (Paid)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#69574A]">Memuat daftar pesanan...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#FFFCF7] p-12 rounded-2xl border border-[#D8C9B7] text-center text-[#69574A]">
          <p className="text-sm">Tidak ada pesanan yang sesuai dengan filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isOrderUpdating = isUpdating === order.id;

            return (
              <div
                key={order.id}
                className={`bg-[#FFFCF7] rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                  order.status === 'menunggu'
                    ? 'border-[#C67D26] ring-1 ring-[#C67D26]/30'
                    : 'border-[#D8C9B7]'
                }`}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[#D8C9B7]/60">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg font-bold text-[#34241C]">
                          Meja {order.tableNumber}
                        </span>
                        {order.customerName && (
                          <span className="text-xs text-[#69574A] truncate max-w-[120px]">
                            • {order.customerName}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-[#896A50] block mt-0.5">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-base font-bold text-[#34241C] block">
                        {formatRupiah(order.totalAmount)}
                      </span>
                      <span className="text-[10px] text-[#69574A]">
                        {formatTimeOnly(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#D8C9B7]/40">
                    <OrderBadge status={order.status} size="sm" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-[#896A50]">
                        {order.paymentMethod}
                      </span>
                      <PaymentBadge status={order.paymentStatus} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Items Body */}
                <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#34241C]">
                            <strong className="text-[#896A50]">{item.quantity}×</strong> {item.productName}
                          </span>
                          <span className="font-semibold text-[#69574A] whitespace-nowrap">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-[#896A50] bg-[#F5EFE5] px-2 py-0.5 rounded mt-1 border border-[#D8C9B7]/50 italic">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="p-2.5 bg-[#FDF3E5] rounded-xl border border-[#F0CBA0] text-xs text-[#C67D26] mt-3">
                      <span className="font-bold block">Catatan Meja:</span>
                      <span>{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Toolbar */}
                <div className="p-4 sm:p-5 bg-[#F5EFE5] border-t border-[#D8C9B7] space-y-2.5">
                  {/* Payment Confirmation Button */}
                  {order.paymentStatus === 'pending' && (
                    <button
                      type="button"
                      disabled={isOrderUpdating}
                      onClick={() => handleConfirmPayment(order.id, 'paid')}
                      className="w-full py-2 px-3 rounded-lg bg-[#3D784E] hover:bg-[#32613F] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Konfirmasi Pembayaran ({order.paymentMethod.toUpperCase()})</span>
                    </button>
                  )}

                  {/* Status Advancement Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'menunggu' && (
                      <button
                        type="button"
                        disabled={isOrderUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'diproses')}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 text-[#E5D8C7]" />
                        <span>Mulai Racik</span>
                      </button>
                    )}

                    {order.status === 'diproses' && (
                      <button
                        type="button"
                        disabled={isOrderUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'siap_diantar')}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-[#E5D8C7]" />
                        <span>Siap Diantar</span>
                      </button>
                    )}

                    {order.status === 'siap_diantar' && (
                      <button
                        type="button"
                        disabled={isOrderUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'selesai')}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#3D784E] hover:bg-[#32613F] text-[#FFFCF7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    )}

                    {/* Cancel action if not yet finished */}
                    {['menunggu', 'diproses'].includes(order.status) && (
                      <button
                        type="button"
                        disabled={isOrderUpdating}
                        onClick={() => {
                          if (window.confirm('Batalkan pesanan ini?')) {
                            handleUpdateStatus(order.id, 'dibatalkan');
                          }
                        }}
                        className="py-2 px-3 rounded-lg text-xs text-[#B83E3E] hover:bg-[#FCEBEB] border border-[#F0B8B8] transition-colors"
                        title="Batalkan Pesanan"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
