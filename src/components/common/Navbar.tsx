import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Coffee, MapPin, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onOpenCart?: () => void;
  onSelectTable?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onSelectTable }) => {
  const { totalItems, tableNumber, locationNote } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-[#F5EFE5]/95 backdrop-blur-md border-b border-[#D8C9B7]">
      <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-[#34241C] text-[#F5EFE5] flex items-center justify-center transition-transform group-hover:scale-105">
            <Coffee className="w-5 h-5 text-[#E5D8C7]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#34241C] leading-none">
              SEDOH KOPI
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#896A50] font-medium mt-0.5">
              Warkop & Roastery Modern
            </span>
          </div>
        </Link>

        {/* Center / Right Table Badge & Cart */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Table Badge */}
          {tableNumber ? (
            <button
              onClick={onSelectTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E5D8C7] hover:bg-[#D8C9B7] text-[#34241C] text-xs sm:text-sm font-medium border border-[#D8C9B7] transition-colors"
              title="Klik untuk ubah nomor meja"
            >
              <MapPin className="w-3.5 h-3.5 text-[#896A50]" />
              <span>Meja {tableNumber}</span>
              {locationNote && (
                <span className="hidden md:inline text-[11px] text-[#69574A] truncate max-w-[120px]">
                  • {locationNote}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onSelectTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFCF7] text-[#896A50] text-xs sm:text-sm font-medium border border-dashed border-[#D8C9B7] hover:border-[#896A50] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilih Meja</span>
            </button>
          )}

          {/* Cashier Link */}
          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-1 text-xs text-[#69574A] hover:text-[#34241C] font-medium px-2 py-1.5 rounded transition-colors"
            title="Dashboard Kasir"
          >
            <ShieldCheck className="w-4 h-4 text-[#896A50]" />
            <span>Kasir</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#F5EFE5] transition-transform active:scale-95 shadow-sm"
            aria-label="Keranjang Pesanan"
          >
            <ShoppingBag className="w-5 h-5 text-[#E5D8C7]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C67D26] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#F5EFE5] shadow-xs">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
