import React, { useState, useEffect } from 'react';
import type { Category } from '../../types';
import { Plus, Edit2, Layers, AlertCircle, X } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        setError('Gagal memuat kategori.');
      }
    } catch {
      setError('Koneksi server bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      sortOrder: (categories.length + 1),
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert(data.error || 'Gagal menyimpan kategori.');
      }
    } catch {
      alert('Koneksi server terputus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Struktur Menu
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Kategori Menu Warkop
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#E5D8C7]" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5EFE5] text-[#69574A] uppercase tracking-wider font-semibold border-b border-[#D8C9B7]">
            <tr>
              <th className="py-3 px-4">Urutan</th>
              <th className="py-3 px-4">Nama Kategori</th>
              <th className="py-3 px-4">Slug URL</th>
              <th className="py-3 px-4">Deskripsi</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8C9B7]/50 text-[#34241C]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#69574A]">
                  Memuat kategori...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#69574A]">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#F5EFE5]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#896A50]">
                    #{c.sortOrder}
                  </td>
                  <td className="py-3.5 px-4 font-serif text-sm font-bold">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#69574A]">
                    {c.slug}
                  </td>
                  <td className="py-3.5 px-4 text-[#69574A] max-w-sm truncate">
                    {c.description || '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.isActive
                          ? 'bg-[#E8F2EA] text-[#3D784E]'
                          : 'bg-[#FCEBEB] text-[#B83E3E]'
                      }`}
                    >
                      {c.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-[#69574A] hover:text-[#34241C] hover:bg-[#E5D8C7]"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5]">
              <h3 className="font-serif text-lg font-bold text-[#34241C]">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setFormData({ ...formData, name, slug: formData.slug || slug });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Deskripsi Kategori
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#34241C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-[#34241C]"
                    />
                    <span>Aktif</span>
                  </label>
                </div>
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
