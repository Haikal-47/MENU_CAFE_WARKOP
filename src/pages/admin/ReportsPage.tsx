import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../utils/formatters';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Banknote,
  QrCode,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        setError('Gagal memuat data laporan.');
      }
    } catch {
      setError('Koneksi server bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const s = data?.summary || {};
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Kinerja Finansial & Produk
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Laporan Penjualan Warkop
          </h1>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFCF7] text-xs font-medium text-[#34241C] border border-[#D8C9B7] hover:bg-[#E5D8C7]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#896A50]" />
          <span>Perbarui Laporan</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-xs text-[#69574A]">
          <div className="w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Mengkalkulasi data penjualan dari database...</span>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#896A50] block mb-1">
                Total Omset Terverifikasi
              </span>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
                {formatRupiah(s.totalRevenue || 0)}
              </div>
              <span className="text-[11px] text-[#69574A] mt-1 block">
                Akumulasi dari {s.totalOrdersCount || 0} transaksi lunas
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
              <div className="flex items-center justify-between text-[#896A50] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Metode QRIS</span>
                <QrCode className="w-4 h-4" />
              </div>
              <div className="font-serif text-2xl font-bold text-[#34241C]">
                {formatRupiah(s.totalQrisRevenue || 0)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-[#F5EFE5] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3D784E] h-full"
                    style={{ width: `${s.qrisShare || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#3D784E]">{s.qrisShare || 0}%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFCF7] border border-[#D8C9B7] shadow-xs">
              <div className="flex items-center justify-between text-[#896A50] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Metode Tunai / Cash</span>
                <Banknote className="w-4 h-4" />
              </div>
              <div className="font-serif text-2xl font-bold text-[#34241C]">
                {formatRupiah(s.totalCashRevenue || 0)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-[#F5EFE5] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#896A50] h-full"
                    style={{ width: `${s.cashShare || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#896A50]">{s.cashShare || 0}%</span>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#D8C9B7]">
              <h2 className="font-serif text-lg font-bold text-[#34241C]">
                Menu Paling Laris (Best Sellers)
              </h2>
              <p className="text-xs text-[#69574A]">
                Peringkat menu terpopuler dihitung berdasarkan jumlah kuantitas pesanan nyata
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5EFE5] text-[#69574A] uppercase tracking-wider font-semibold border-b border-[#D8C9B7]">
                  <tr>
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Porsi Terjual</th>
                    <th className="py-3 px-4 text-right">Total Penjualan (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8C9B7]/50 text-[#34241C]">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#69574A]">
                        Belum ada data transaksi menu terjual.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p: any, idx: number) => (
                      <tr key={p.productName} className="hover:bg-[#F5EFE5]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#896A50]">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-serif text-sm font-bold">
                          {p.productName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded bg-[#E5D8C7] text-[#34241C] font-semibold text-xs">
                            {p.totalSold} porsi
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-serif font-bold text-sm">
                          {formatRupiah(Number(p.totalSales))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
