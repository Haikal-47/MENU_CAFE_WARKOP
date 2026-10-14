import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/formatters';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { TableSelectorModal } from '../../components/customer/TableSelectorModal';
import {
  ArrowLeft,
  Banknote,
  QrCode,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    totalItems,
    totalAmount,
    tableNumber,
    tableToken,
    locationNote,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('qris');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // If cart is empty, redirect back
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE5] flex flex-col justify-between">
        <Navbar onSelectTable={() => setIsTableModalOpen(true)} />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E5D8C7] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#896A50]" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#34241C]">
            Keranjang Masih Kosong
          </h2>
          <p className="text-xs text-[#69574A] mt-2 mb-6">
            Pilihlah menu seduhan kopi atau camilan terlebih dahulu sebelum melakukan checkout.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#34241C] text-[#FFFCF7] text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Menu</span>
          </Link>
        </div>
        <Footer />
        <TableSelectorModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
        />
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!tableToken || !tableNumber) {
      setErrorMessage('Nomor meja belum ditentukan. Silakan pilih meja Anda terlebih dahulu.');
      setIsTableModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Generate unique idempotency key
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload = {
        tableToken,
        customerName: customerName.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        paymentMethod,
        idempotencyKey,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal memproses pesanan Anda.');
        setIsSubmitting(false);
        return;
      }

      // Clear local cart upon successful order creation
      clearCart();

      // Navigate to live status page
      navigate(`/order/${data.order.orderNumber}`);
    } catch (err) {
      setErrorMessage('Gagal menghubungi server. Mohon periksa koneksi internet Anda.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE5] flex flex-col">
      <Navbar onSelectTable={() => setIsTableModalOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Breadcrumb back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#69574A] hover:text-[#34241C] font-medium mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali & Tambah Menu Lain</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-[#D8C9B7] pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
              Konfirmasi & Pembayaran
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
              Rincian Pesanan Anda
            </h1>
          </div>
          <span className="text-xs text-[#69574A]">{totalItems} item dalam pesanan</span>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#FCEBEB] border border-[#F0B8B8] flex items-start gap-3 text-xs text-[#B83E3E]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Pemesanan Belum Dapat Dilanjutkan</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left col: Customer info & Items summary */}
            <div className="lg:col-span-7 space-y-6">
              {/* Table Info Card */}
              <div className="bg-[#FFFCF7] p-5 rounded-2xl border border-[#D8C9B7] shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#896A50]" />
                    <span className="font-serif text-base font-bold text-[#34241C]">
                      Nomor Meja Anda
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTableModalOpen(true)}
                    className="text-xs text-[#896A50] font-semibold hover:underline"
                  >
                    Ubah Meja
                  </button>
                </div>

                {tableNumber ? (
                  <div className="mt-3 p-3 rounded-xl bg-[#F5EFE5] border border-[#D8C9B7] flex items-center justify-between">
                    <div>
                      <span className="font-serif text-xl font-bold text-[#34241C]">
                        Meja {tableNumber}
                      </span>
                      {locationNote && (
                        <p className="text-xs text-[#69574A] mt-0.5">{locationNote}</p>
                      )}
                    </div>
                    <span className="text-xs bg-[#E8F2EA] text-[#3D784E] font-medium px-2.5 py-1 rounded-full border border-[#B8D8BF]">
                      Terverifikasi
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-[#FDF3E5] border border-[#F0CBA0] text-xs text-[#C67D26]">
                    Nomor meja belum terdeteksi. Silakan klik "Ubah Meja" untuk memilih meja Anda.
                  </div>
                )}
              </div>

              {/* Customer details */}
              <div className="bg-[#FFFCF7] p-5 rounded-2xl border border-[#D8C9B7] shadow-xs space-y-4">
                <h3 className="font-serif text-base font-bold text-[#34241C]">
                  Informasi Tambahan (Opsional)
                </h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1.5">
                    Nama Pemesan
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Haikal / Mas Dimas"
                    maxLength={50}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                  />
                  <span className="text-[10px] text-[#69574A] mt-1 block">
                    Nama membantu barista memanggil atau mengonfirmasi saat mengantarkan pesanan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1.5">
                    Catatan Keseluruhan Pesanan
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Contoh: Tolong diantar bersamaan saat makanan siap..."
                    rows={2}
                    maxLength={300}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                  />
                </div>
              </div>

              {/* Order Items Snapshot */}
              <div className="bg-[#FFFCF7] p-5 rounded-2xl border border-[#D8C9B7] shadow-xs">
                <h3 className="font-serif text-base font-bold text-[#34241C] mb-3">
                  Ringkasan Menu yang Dipesan
                </h3>
                <div className="divide-y divide-[#D8C9B7]/50">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-sm font-bold text-[#34241C]">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-[#69574A] mt-0.5">
                          {item.quantity} × {formatRupiah(item.product.price)}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-[#69574A] italic mt-1">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="font-serif text-sm font-bold text-[#34241C] whitespace-nowrap">
                        {formatRupiah(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right col: Payment method & Confirmation */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#FFFCF7] p-5 sm:p-6 rounded-2xl border border-[#D8C9B7] shadow-xs sticky top-24">
                <h3 className="font-serif text-lg font-bold text-[#34241C] mb-4">
                  Metode Pembayaran
                </h3>

                {/* Payment Selector Buttons */}
                <div className="space-y-3 mb-6">
                  {/* QRIS Option */}
                  <label
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'qris'
                        ? 'bg-[#F5EFE5] border-[#34241C] shadow-xs'
                        : 'bg-[#FFFCF7] border-[#D8C9B7] hover:border-[#896A50]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qris"
                        checked={paymentMethod === 'qris'}
                        onChange={() => setPaymentMethod('qris')}
                        className="mt-1 text-[#34241C] focus:ring-[#896A50]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#34241C] flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-[#896A50]" />
                            QRIS (BCA, GoPay, OVO, ShopeePay)
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D784E] bg-[#E8F2EA] px-2 py-0.5 rounded">
                            Disarankan
                          </span>
                        </div>
                        <p className="text-xs text-[#69574A] mt-1 leading-relaxed">
                          Scan kode QRIS merchant di layar instruksi berikutnya menggunakan aplikasi m-banking atau e-wallet Anda.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Cash Option */}
                  <label
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#F5EFE5] border-[#34241C] shadow-xs'
                        : 'bg-[#FFFCF7] border-[#D8C9B7] hover:border-[#896A50]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="mt-1 text-[#34241C] focus:ring-[#896A50]"
                      />
                      <div className="flex-1">
                        <span className="font-serif font-bold text-sm text-[#34241C] flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-[#896A50]" />
                          Tunai / Cash di Kasir
                        </span>
                        <p className="text-xs text-[#69574A] mt-1 leading-relaxed">
                          Bayar langsung ke meja kasir dengan uang tunai setelah pesanan terkirim. Kasir akan memverifikasi pembayaran.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Amount breakdown */}
                <div className="border-t border-[#D8C9B7]/60 pt-4 space-y-2 mb-6">
                  <div className="flex items-center justify-between text-xs text-[#69574A]">
                    <span>Subtotal Harga ({totalItems} item)</span>
                    <span className="font-semibold text-[#34241C]">{formatRupiah(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#69574A]">
                    <span>Biaya Layanan Meja</span>
                    <span className="font-semibold text-[#3D784E]">Gratis</span>
                  </div>
                  <div className="flex items-center justify-between text-base border-t border-[#D8C9B7]/60 pt-3">
                    <span className="font-serif font-bold text-[#34241C]">Total Bayar</span>
                    <span className="font-serif text-xl font-bold text-[#34241C]">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !tableNumber}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#34241C] hover:bg-[#221711] disabled:opacity-50 text-[#FFFCF7] text-sm font-semibold tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FFFCF7] border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#E5D8C7]" />
                      <span>Kirim Pesanan Sekarang</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#69574A] text-center mt-3 leading-relaxed">
                  Dengan mengonfirmasi, pesanan Anda akan langsung diteruskan ke sistem dapur warkop kami.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />

      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
};
