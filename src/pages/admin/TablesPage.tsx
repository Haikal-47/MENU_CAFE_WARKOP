import React, { useState, useEffect, useRef } from 'react';
import type { CafeTable } from '../../types';
import {
  Plus,
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Edit2,
  AlertCircle,
  X,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import QRCode from 'qrcode';

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    locationNote: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Preview Modal State
  const [qrModalTable, setQrModalTable] = useState<CafeTable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvgString, setQrSvgString] = useState<string | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
      } else {
        setError('Gagal memuat daftar meja.');
      }
    } catch {
      setError('Koneksi server bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const getTableOrderUrl = (token: string) => {
    const origin = window.location.origin;
    return `${origin}/?table=${token}`;
  };

  const handleOpenQrModal = async (tbl: CafeTable) => {
    setQrModalTable(tbl);
    const targetUrl = getTableOrderUrl(tbl.qrToken);

    try {
      const pngUrl = await QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#34241C',
          light: '#FFFCF7',
        },
      });
      setQrDataUrl(pngUrl);

      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#34241C',
          light: '#FFFCF7',
        },
      });
      setQrSvgString(svg);
    } catch (err) {
      console.error('Failed to generate QR', err);
    }
  };

  const handleDownloadPng = (tableNumber: string) => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Meja_${tableNumber}_SedohKopi.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = (tableNumber: string) => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Meja_${tableNumber}_SedohKopi.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleRegenerateToken = async (id: string, tableNumber: string) => {
    if (
      !window.confirm(
        `Perbarui token QR untuk Meja ${tableNumber}? Stiker QR lama di meja tidak akan dapat digunakan lagi.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tables/${id}/regenerate-token`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchTables();
        if (qrModalTable?.id === id) {
          handleOpenQrModal(data.table);
        }
      } else {
        alert(data.error || 'Gagal meregenerasi token.');
      }
    } catch {
      alert('Koneksi terputus.');
    }
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: `${tables.length + 1 < 10 ? '0' : ''}${tables.length + 1}`,
      locationNote: 'Lantai 1',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: CafeTable) => {
    setEditingTable(t);
    setFormData({
      tableNumber: t.tableNumber,
      locationNote: t.locationNote || '',
      isActive: t.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingTable
        ? `/api/admin/tables/${editingTable.id}`
        : '/api/admin/tables';
      const method = editingTable ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchTables();
      } else {
        alert(data.error || 'Gagal menyimpan meja.');
      }
    } catch {
      alert('Koneksi server bermasalah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Manajemen Lokasi & Meja
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Meja & QR Code Pesanan
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#E5D8C7]" />
          <span>Tambah Meja Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 no-print">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#69574A] text-xs">
            Memuat daftar meja warkop...
          </div>
        ) : tables.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#69574A] text-xs">
            Belum ada meja didaftarkan.
          </div>
        ) : (
          tables.map((tbl) => (
            <div
              key={tbl.id}
              className={`p-5 rounded-2xl bg-[#FFFCF7] border transition-all flex flex-col justify-between shadow-xs ${
                tbl.isActive ? 'border-[#D8C9B7]' : 'border-stone-300 opacity-60 bg-stone-100'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#34241C] text-[#E5D8C7] flex items-center justify-center font-serif font-bold text-sm">
                      {tbl.tableNumber}
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#34241C]">
                        Meja {tbl.tableNumber}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          tbl.isActive
                            ? 'bg-[#E8F2EA] text-[#3D784E]'
                            : 'bg-[#FCEBEB] text-[#B83E3E]'
                        }`}
                      >
                        {tbl.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(tbl)}
                    className="p-1.5 rounded-lg text-[#69574A] hover:bg-[#E5D8C7] hover:text-[#34241C]"
                    title="Edit Meja"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {tbl.locationNote && (
                  <p className="text-xs text-[#69574A] mt-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#896A50] shrink-0" />
                    <span>{tbl.locationNote}</span>
                  </p>
                )}

                <div className="mt-3 p-2 bg-[#F5EFE5] rounded-lg border border-[#D8C9B7]/60">
                  <span className="text-[10px] text-[#69574A] uppercase tracking-wider block font-mono truncate">
                    Token: {tbl.qrToken}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-[#D8C9B7]/50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQrModal(tbl)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#E5D8C7]" />
                  <span>Lihat & Unduh QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRegenerateToken(tbl.id, tbl.tableNumber)}
                  className="p-2 rounded-lg text-[#69574A] hover:bg-[#E5D8C7] hover:text-[#34241C] border border-[#D8C9B7]"
                  title="Regenerasi Token QR (Ganti Kunci)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Code Preview & Export Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5] no-print">
              <h3 className="font-serif text-lg font-bold text-[#34241C]">
                QR Code Meja {qrModalTable.tableNumber}
              </h3>
              <button
                onClick={() => setQrModalTable(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Mockup Stand */}
            <div className="p-6 text-center space-y-4 overflow-y-auto">
              <div className="border-2 border-dashed border-[#D8C9B7] p-6 rounded-2xl bg-white max-w-xs mx-auto shadow-sm">
                <span className="font-serif text-xl font-bold text-[#34241C] block">
                  SEDOH KOPI
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#896A50] block mt-0.5">
                  Warkop Modern & Roastery
                </span>

                <div className="my-4 p-2 bg-[#F5EFE5] rounded-xl inline-block border border-[#D8C9B7]">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt={`QR Meja ${qrModalTable.tableNumber}`}
                      className="w-48 h-48 mx-auto"
                    />
                  )}
                </div>

                <div className="font-serif text-2xl font-bold text-[#34241C]">
                  MEJA {qrModalTable.tableNumber}
                </div>
                {qrModalTable.locationNote && (
                  <span className="text-xs text-[#69574A] block mt-0.5">
                    {qrModalTable.locationNote}
                  </span>
                )}

                <div className="mt-4 pt-3 border-t border-[#D8C9B7]/60 text-[11px] text-[#69574A] leading-tight">
                  Pindai QR ini dengan kamera HP untuk memilih menu dan pesan langsung dari meja Anda.
                </div>
              </div>

              {/* URL String */}
              <div className="text-[11px] text-[#69574A] font-mono bg-[#F5EFE5] p-2.5 rounded-lg border border-[#D8C9B7] break-all no-print">
                {getTableOrderUrl(qrModalTable.qrToken)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-[#F5EFE5] border-t border-[#D8C9B7] flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPng(qrModalTable.tableNumber)}
                  className="px-3 py-2 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#E5D8C7]" />
                  <span>PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSvg(qrModalTable.tableNumber)}
                  className="px-3 py-2 rounded-lg bg-[#FFFCF7] hover:bg-[#E5D8C7] text-[#34241C] border border-[#D8C9B7] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrintCard}
                className="px-3.5 py-2 rounded-lg bg-[#896A50] hover:bg-[#72543d] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Mockup Meja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="w-full max-w-sm bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5]">
              <h3 className="font-serif text-lg font-bold text-[#34241C]">
                {editingTable ? 'Edit Data Meja' : 'Tambah Meja Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Nomor Meja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  placeholder="Contoh: 09, 10, VIP-1"
                  className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Keterangan Lokasi
                </label>
                <input
                  type="text"
                  value={formData.locationNote}
                  onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                  placeholder="Contoh: Lantai 2 - Dekat Jendela"
                  className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[#34241C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#34241C]"
                  />
                  <span>Meja Aktif (Bisa Menerima Pesanan)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#D8C9B7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#69574A] hover:bg-[#E5D8C7]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Meja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
