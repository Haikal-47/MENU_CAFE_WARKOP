import React from 'react';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { Plus, Check, MessageSquare } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onQuickAdd: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onQuickAdd,
  onOpenDetail,
}) => {
  const isAvailable = product.isAvailable;

  return (
    <div
      className={`group relative flex flex-col justify-between bg-[#FFFCF7] rounded-xl border border-[#D8C9B7] overflow-hidden transition-all duration-200 hover:border-[#896A50] hover:shadow-sm ${
        !isAvailable ? 'opacity-60 bg-stone-100/60' : ''
      }`}
    >
      <div>
        {/* Thumbnail Image */}
        <div
          onClick={() => isAvailable && onOpenDetail(product)}
          className="relative aspect-4/3 w-full bg-[#E5D8C7] overflow-hidden cursor-pointer"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-103 ${
              !isAvailable ? 'grayscale' : ''
            }`}
            loading="lazy"
          />

          {/* Availability Tag */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <span className="px-2.5 py-1 rounded bg-[#B83E3E] text-white text-[11px] font-bold tracking-wider uppercase">
                Habis Hari Ini
              </span>
            </div>
          )}

          {/* Cart Quantity Badge if in cart */}
          {quantityInCart > 0 && isAvailable && (
            <div className="absolute top-2 right-2 bg-[#34241C] text-[#FFFCF7] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-[#E5D8C7]/50">
              <Check className="w-3 h-3 text-[#E5D8C7]" />
              <span>{quantityInCart} di keranjang</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => isAvailable && onOpenDetail(product)}
              className="font-serif text-base sm:text-lg font-bold text-[#34241C] leading-snug cursor-pointer hover:text-[#896A50] transition-colors line-clamp-1"
            >
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-[#69574A] mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-[#D8C9B7]/40 mt-1">
        <span className="font-serif text-sm sm:text-base font-bold text-[#34241C]">
          {formatRupiah(product.price)}
        </span>

        {isAvailable ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="p-2 rounded-lg bg-[#F5EFE5] hover:bg-[#E5D8C7] text-[#69574A] border border-[#D8C9B7] transition-colors"
              title="Tambah Catatan (Less sugar, tanpa es, dll)"
              aria-label="Catatan Khusus"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-xs"
              aria-label={`Tambah ${product.name} ke keranjang`}
            >
              <Plus className="w-3.5 h-3.5 text-[#E5D8C7]" />
              <span className="hidden sm:inline">Pesan</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-[#69574A] italic">Tidak tersedia</span>
        )}
      </div>
    </div>
  );
};
