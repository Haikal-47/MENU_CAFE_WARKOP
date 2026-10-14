import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Order } from '../../types';
import { formatRupiah, formatDateTime, getPaymentMethodLabel } from '../../utils/formatters';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { OrderBadge, PaymentBadge } from '../../components/common/Badge';
import {
  CheckCircle2,
  Clock,
  Coffee,
  Check,
  AlertCircle,
  QrCode,
  Banknote,
  ArrowRight,
  RefreshCw,
  MapPin,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

export const OrderStatusPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [qrisDataUrl, setQrisDataUrl] = useState<string | null>(null);

  const fetchOrder = async (isPolling = false) => {
    if (!orderNumber) return;
    if (!isPolling) setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setError(null);
        setLastRefreshed(new Date());

        // Generate QRIS preview data URL if method is qris
        if (data.order.paymentMethod === 'qris' && !qrisDataUrl) {
          // Generates QR Code representing the payment string for the order
          const qrisString = `00020101021126580014ID.LINKAJA.WWW01189360091400000000000215ID102002140000051040000520458125303360540${data.order.totalAmount}5802ID5910SEDOHKOPI6007JAKARTA62070703A016304`;
          QRCode.toDataURL(qrisString, {
            width: 260,
            margin: 2,
            color: {
              dark: '#34241C',
              light: '#FFFCF7',
            },
          }).then((url) => setQrisDataUrl(url));
        }
      } else {
        setError('Pesanan tidak ditemukan.');
      }
    } catch {
      if (!isPolling) setError('Gagal memuat status pesanan.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-polling every 5 seconds for real-time status update
    const interval = setInterval(() => {
      fetchOrder(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [orderNumber]);

  const steps = [
    { key: 'menunggu', label: 'Menunggu Konfirmasi', desc: 'Kasir memeriksa ketersediaan & pembayaran' },
    { key: 'diproses', label: 'Sedang Diracik', desc: 'Barista & dapur sedang membuat pesanan Anda' },
    { key: 'siap_diantar', label: 'Siap Diantar', desc: 'Pesanan sedang dibawa menuju meja Anda' },
    { key: 'selesai', label: 'Selesai', desc: 'Pesanan telah diterima. Selamat menikmati!' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'menunggu') return 0;
    if (status === 'diproses') return 1;
    if (status === 'siap_diantar') return 2;
    if (status === 'selesai') return 3;
    return -1; // dibatalkan
  };

  const currentStepIndex = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'dibatalkan';

  return (
    <div className="min-h-screen bg-[#F5EFE5] flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-[#69574A] font-medium">
              Memuat status pesanan...
            </p>
          </div>
        ) : error || !order ? (
          <div className="bg-[#FCEBEB] border border-[#F0B8B8] p-8 rounded-2xl text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-[#B83E3E] mx-auto mb-3" />
            <h2 className="font-serif text-xl font-bold text-[#B83E3E]">
              Pesanan Tidak Ditemukan
            </h2>
            <p className="text-xs text-[#69574A] mt-2 mb-6">
              Nomor pesanan "{orderNumber}" tidak ditemukan dalam database warkop kami.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#34241C] text-[#FFFCF7] text-xs font-semibold"
            >
              <span>Kembali ke Halaman Menu</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Ticket Card */}
            <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8C9B7]/60 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
                      Pesanan Warkop
                    </span>
                    <span className="text-[10px] text-[#69574A]">
                      • Update otomatis tiap 5 dtk
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C] tracking-tight mt-0.5">
                    {order.orderNumber}
                  </h1>
                  <p className="text-xs text-[#69574A] mt-1">
                    Dibuat pada {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#F5EFE5] border border-[#D8C9B7] text-right">
                    <span className="text-[10px] text-[#896A50] uppercase tracking-wider block">
                      Tujuan Antar
                    </span>
                    <span className="font-serif text-lg font-bold text-[#34241C]">
                      Meja {order.tableNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Payment badges summary */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#69574A]">Status Pesanan:</span>
                  <OrderBadge status={order.status} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#69574A]">Pembayaran:</span>
                  <PaymentBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Stepper Visual Timeline */}
            {!isCancelled ? (
              <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] p-6 shadow-sm">
                <h3 className="font-serif text-base font-bold text-[#34241C] mb-6">
                  Progres Pengerjaan
                </h3>

                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8C9B7]">
                  {steps.map((st, idx) => {
                    const isDone = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={st.key} className="relative flex items-start gap-4">
                        {/* Circle bullet */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors border-2 ${
                            isDone
                              ? 'bg-[#3D784E] border-[#3D784E] text-white'
                              : isCurrent
                              ? 'bg-[#34241C] border-[#34241C] text-white ring-4 ring-[#E5D8C7]'
                              : 'bg-[#FFFCF7] border-[#D8C9B7] text-[#69574A]'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>

                        <div>
                          <h4
                            className={`font-serif text-sm font-bold ${
                              isCurrent ? 'text-[#34241C] text-base' : isDone ? 'text-[#3D784E]' : 'text-[#69574A]'
                            }`}
                          >
                            {st.label}
                          </h4>
                          <p className="text-xs text-[#69574A] mt-0.5">{st.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#FCEBEB] border border-[#F0B8B8] p-5 rounded-2xl text-center text-[#B83E3E]">
                <h3 className="font-serif text-base font-bold">Pesanan Ini Dibatalkan</h3>
                <p className="text-xs mt-1">
                  Pesanan telah dibatalkan oleh kasir atau sistem. Silakan hubungi barista untuk informasi lebih lanjut.
                </p>
              </div>
            )}

            {/* Payment Instructions (If Pending) */}
            {order.paymentStatus === 'pending' && !isCancelled && (
              <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#D8C9B7]/50">
                  {order.paymentMethod === 'qris' ? (
                    <QrCode className="w-5 h-5 text-[#896A50]" />
                  ) : (
                    <Banknote className="w-5 h-5 text-[#896A50]" />
                  )}
                  <h3 className="font-serif text-base font-bold text-[#34241C]">
                    Petunjuk Pembayaran ({getPaymentMethodLabel(order.paymentMethod)})
                  </h3>
                </div>

                {order.paymentMethod === 'qris' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Preview */}
                    <div className="p-3 bg-white rounded-xl border border-[#D8C9B7] shadow-xs shrink-0 text-center">
                      {qrisDataUrl ? (
                        <img
                          src={qrisDataUrl}
                          alt="QRIS Merchant Warkop"
                          className="w-48 h-48 mx-auto"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-stone-100 flex items-center justify-center text-xs text-[#69574A]">
                          Membuat QRIS...
                        </div>
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#69574A] block mt-1">
                        QRIS Standar Indonesia
                      </span>
                    </div>

                    {/* Instruction steps */}
                    <div className="space-y-3 text-xs text-[#69574A]">
                      <div className="p-3 bg-[#F5EFE5] rounded-xl border border-[#D8C9B7]">
                        <span className="text-[10px] uppercase tracking-wider text-[#896A50] block">
                          Total Nominal yang Harus Ditransfer
                        </span>
                        <span className="font-serif text-xl font-bold text-[#34241C]">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>

                      <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                        <li>Buka aplikasi m-Banking (BCA, Mandiri, BRI) atau e-Wallet (GoPay, OVO, ShopeePay, DANA).</li>
                        <li>Pindai (Scan) kode QR di samping dan masukkan nominal tepat sebesar <strong>{formatRupiah(order.totalAmount)}</strong>.</li>
                        <li>Setelah transfer berhasil, sebutkan nomor pesanan <strong>{order.orderNumber}</strong> ke kasir.</li>
                        <li>Kasir akan memverifikasi mutasi dan mengonfirmasi pembayaran Anda.</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F5EFE5] rounded-xl border border-[#D8C9B7] space-y-2 text-xs text-[#69574A]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#896A50]">
                        Nominal Tunai
                      </span>
                      <span className="font-serif text-lg font-bold text-[#34241C]">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      Silakan menuju meja kasir bar warkop kami dan sebutkan nomor pesanan <strong>{order.orderNumber}</strong> untuk melakukan pembayaran tunai.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Order Items Breakdown */}
            <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] p-6 shadow-sm">
              <h3 className="font-serif text-base font-bold text-[#34241C] mb-4">
                Daftar Menu yang Dipesan
              </h3>

              <div className="divide-y divide-[#D8C9B7]/50">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-serif text-sm font-bold text-[#34241C]">
                        {item.productName}
                      </span>
                      <div className="text-xs text-[#69574A] mt-0.5">
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-[#896A50] mt-1 bg-[#F5EFE5] px-2 py-0.5 rounded inline-block">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>
                    <span className="font-serif text-sm font-bold text-[#34241C]">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#D8C9B7] pt-4 mt-4 flex items-center justify-between text-base">
                <span className="font-serif font-bold text-[#34241C]">Total Tagihan</span>
                <span className="font-serif text-xl font-bold text-[#34241C]">
                  {formatRupiah(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                to="/"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs sm:text-sm font-semibold tracking-wide text-center transition-colors shadow-xs"
              >
                Pesan Menu Tambahan
              </Link>

              <button
                type="button"
                onClick={() => fetchOrder()}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#FFFCF7] hover:bg-[#E5D8C7] text-[#34241C] text-xs font-semibold border border-[#D8C9B7] flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#896A50]" />
                <span>Perbarui Status</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
