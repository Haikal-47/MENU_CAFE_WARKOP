import React, { useState, useEffect } from 'react';
import type { CafeTable } from '../../types';
import { useCart } from '../../context/CartContext';
import { X, MapPin, Check, QrCode } from 'lucide-react';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tableNumber, setTableInfo } = useCart();
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
      } else {
        setError('Gagal memuat daftar meja.');
      }
    } catch {
      setError('Koneksi bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (tbl: CafeTable) => {
    setTableInfo(tbl.qrToken, tbl.tableNumber, tbl.locationNote);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#896A50]" />
            <h3 className="font-serif text-lg font-bold text-[#34241C]">
              Pilih Meja Anda
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          <p className="text-xs text-[#69574A] leading-relaxed mb-4">
            Jika Anda sudah berada di warkop, pilih nomor meja tempat Anda duduk. Pesanan Anda akan diantar langsung oleh barista ke meja ini.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#69574A]">Memuat daftar meja warkop...</div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-[#B83E3E] bg-[#FCEBEB] rounded-lg p-3">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {tables.map((t) => {
                const isSelected = tableNumber === t.tableNumber;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? 'bg-[#34241C] text-[#FFFCF7] border-[#34241C] shadow-xs'
                        : 'bg-[#F5EFE5] hover:bg-[#E5D8C7] text-[#34241C] border-[#D8C9B7]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base font-bold">
                        Meja {t.tableNumber}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#E5D8C7]" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5 text-[#896A50]" />
                      )}
                    </div>
                    {t.locationNote && (
                      <span
                        className={`text-[10px] mt-1 line-clamp-1 ${
                          isSelected ? 'text-[#E5D8C7]' : 'text-[#69574A]'
                        }`}
                      >
                        {t.locationNote}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-[#F5EFE5] border-t border-[#D8C9B7] text-center">
          <span className="text-[11px] text-[#69574A]">
            💡 Anda juga dapat memindai stiker QR Code yang tertempel di meja Anda untuk membuka meja secara otomatis.
          </span>
        </div>
      </div>
    </div>
  );
};
