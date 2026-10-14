import React, { useState } from 'react';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes: string) => void;
  initialQuantity?: number;
  initialNotes?: string;
}

const NOTE_PRESETS = [
  'Less Sugar (Gula Sedikit)',
  'Tanpa Es (No Ice)',
  'Es Sedikit (Less Ice)',
  'Normal',
  'Pedas Sedang',
  'Ekstra Pedas',
  'Pisah Sambal',
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  initialQuantity = 1,
  initialNotes = '',
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState(initialNotes);

  const handlePresetClick = (preset: string) => {
    if (notes.includes(preset)) return;
    setNotes((prev) => (prev ? `${prev}, ${preset}` : preset));
  };

  const handleConfirm = () => {
    onAddToCart(product, quantity, notes);
    onClose();
  };

  const subtotal = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FFFCF7] rounded-t-2xl sm:rounded-2xl border border-[#D8C9B7] shadow-xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 w-full bg-[#E5D8C7] shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#34241C]/80 hover:bg-[#34241C] text-[#FFFCF7] flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#34241C]">
                {product.name}
              </h3>
              <span className="font-bold text-[#896A50] text-lg whitespace-nowrap">
                {formatRupiah(product.price)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#69574A] leading-relaxed mt-2">
              {product.description}
            </p>
          </div>

          <div className="border-t border-[#D8C9B7]/60 pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1.5">
              Catatan Khusus Barista / Dapur
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: less sugar, tanpa sedotan, tidak terlalu pedas..."
              rows={2}
              maxLength={200}
              className="w-full text-xs sm:text-sm p-3 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-1 focus:ring-[#896A50]"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NOTE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="text-[11px] px-2 py-1 rounded bg-[#F5EFE5] hover:bg-[#E5D8C7] text-[#69574A] border border-[#D8C9B7]/80 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="border-t border-[#D8C9B7]/60 pt-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#34241C]">
              Jumlah Pesanan
            </span>
            <div className="flex items-center gap-3 bg-[#F5EFE5] px-3 py-1.5 rounded-lg border border-[#D8C9B7]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded flex items-center justify-center text-[#34241C] hover:bg-[#E5D8C7] disabled:opacity-40 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-[#34241C] min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded flex items-center justify-center text-[#34241C] hover:bg-[#E5D8C7] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#F5EFE5] border-t border-[#D8C9B7] flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-[#69574A] uppercase tracking-wider block">
              Subtotal
            </span>
            <span className="font-serif text-lg font-bold text-[#34241C]">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98"
          >
            <Check className="w-4 h-4 text-[#E5D8C7]" />
            <span>Tambahkan ({quantity})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
