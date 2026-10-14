import React from 'react';
import { Coffee, Clock, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#34241C] text-[#E5D8C7] border-t border-[#896A50]/30 mt-16 pt-12 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#896A50]/30">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coffee className="w-5 h-5 text-[#E5D8C7]" />
              <span className="font-serif text-xl font-bold text-[#FFFCF7]">SEDOH KOPI</span>
            </div>
            <p className="text-xs text-[#E5D8C7]/80 leading-relaxed max-w-sm">
              Ruang temu, seduhan kopi nusantara berkualitas, dan hidangan warkop legendaris dalam balutan suasana modern yang bersahabat.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2 text-xs">
            <h4 className="font-serif text-sm font-semibold text-[#FFFCF7] uppercase tracking-wider mb-2">
              Jam Operasional
            </h4>
            <div className="flex items-center gap-2 text-[#E5D8C7]/90">
              <Clock className="w-3.5 h-3.5 text-[#896A50]" />
              <span>Senin – Kamis : 08.00 – 23.00 WIB</span>
            </div>
            <div className="flex items-center gap-2 text-[#E5D8C7]/90">
              <Sparkles className="w-3.5 h-3.5 text-[#C67D26]" />
              <span>Jumat – Minggu : 08.00 – 01.00 WIB</span>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-2 text-xs">
            <h4 className="font-serif text-sm font-semibold text-[#FFFCF7] uppercase tracking-wider mb-2">
              Lokasi & Kasir
            </h4>
            <div className="flex items-start gap-2 text-[#E5D8C7]/90">
              <MapPin className="w-3.5 h-3.5 text-[#896A50] mt-0.5 shrink-0" />
              <span>Kawasan Kreatif & Kuliner Urban, Jl. Pemuda No. 47</span>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-block text-[11px] text-[#E5D8C7]/60 hover:text-[#FFFCF7] underline underline-offset-4"
              >
                Masuk Akses Kasir & Barista &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#E5D8C7]/50 gap-2">
          <span>&copy; {new Date().getFullYear()} Sedoh Kopi Warkop Modern. Hak Cipta Dilindungi.</span>
          <span>Sistem Pemesanan QR & Meja Terintegrasi</span>
        </div>
      </div>
    </footer>
  );
};
