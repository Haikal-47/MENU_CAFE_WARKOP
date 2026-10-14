import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/formatters';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, MapPin } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTable,
}) => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
    tableNumber,
  } = useCart();

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FFFCF7] h-full flex flex-col shadow-2xl border-l border-[#D8C9B7] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#896A50]" />
            <h3 className="font-serif text-lg font-bold text-[#34241C]">
              Pesanan Meja {tableNumber ? `#${tableNumber}` : ''}
            </h3>
            <span className="text-xs bg-[#E5D8C7] text-[#34241C] font-semibold px-2 py-0.5 rounded-full">
              {totalItems} item
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7] transition-colors"
            aria-label="Tutup Keranjang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table Warning if no table selected */}
        {!tableNumber && (
          <div className="bg-[#FDF3E5] px-4 py-2.5 border-b border-[#F0CBA0] flex items-center justify-between text-xs text-[#C67D26]">
            <span>Nomor meja belum ditentukan.</span>
            <button
              onClick={onSelectTable}
              className="font-bold underline flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Pilih Meja
            </button>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-[#D8C9B7]/40">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#69574A]">
              <div className="w-16 h-16 rounded-full bg-[#E5D8C7]/50 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-[#896A50]" />
              </div>
              <h4 className="font-serif text-base font-bold text-[#34241C]">
                Keranjang Masih Kosong
              </h4>
              <p className="text-xs text-[#69574A] mt-1 max-w-xs">
                Pilih racikan kopi atau hidangan warkop favoritmu dan masukkan ke dalam pesanan.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="pt-3 first:pt-0">
                <div className="flex items-start gap-3">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-[#E5D8C7] shrink-0 border border-[#D8C9B7]/60"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-serif text-sm font-bold text-[#34241C] truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-[#69574A] hover:text-[#B83E3E] p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-[#896A50] mt-0.5">
                      {formatRupiah(item.product.price)}
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-[#69574A] bg-[#F5EFE5] px-2 py-1 rounded mt-1.5 border border-[#D8C9B7]/50">
                        <span className="font-medium text-[#34241C]">Catatan:</span> {item.notes}
                      </div>
                    )}

                    {/* Stepper */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-[#F5EFE5] px-2 py-1 rounded-md border border-[#D8C9B7]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#34241C] hover:bg-[#E5D8C7]"
                          aria-label="Kurang satu"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#34241C] min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#34241C] hover:bg-[#E5D8C7]"
                          aria-label="Tambah satu"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-[#34241C]">
                        {formatRupiah(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#F5EFE5] border-t border-[#D8C9B7] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#69574A]">
              <span>Subtotal ({totalItems} item)</span>
              <span className="font-semibold text-[#34241C]">{formatRupiah(totalAmount)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-[#D8C9B7]/60 pt-2 text-sm">
              <span className="font-serif font-bold text-[#34241C]">Total Pembayaran</span>
              <span className="font-serif text-lg font-bold text-[#34241C]">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="px-3 py-3 rounded-lg text-xs text-[#69574A] hover:text-[#B83E3E] hover:bg-[#E5D8C7] border border-[#D8C9B7] transition-colors"
                title="Kosongkan Semua"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#E5D8C7]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
