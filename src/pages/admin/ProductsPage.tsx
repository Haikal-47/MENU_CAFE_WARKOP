import React, { useState, useEffect } from 'react';
import type { Product, Category } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: 15000,
    imageUrl: '',
    isAvailable: true,
    isFeatured: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData.products || []);
        setCategories(catData.categories || []);
      } else {
        setError('Gagal memuat data produk.');
      }
    } catch {
      setError('Koneksi server bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      price: 15000,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
      isFeatured: !!product.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/toggle`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, isAvailable: data.isAvailable } : p
          )
        );
      } else {
        alert(data.error || 'Gagal mengubah ketersediaan.');
      }
    } catch {
      alert('Koneksi terputus.');
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Hapus produk "${name}" dari menu warkop?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message) alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Gagal menghapus produk.');
      }
    } catch {
      alert('Koneksi terputus.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Gagal menyimpan produk.');
      }
    } catch {
      alert('Koneksi server bermasalah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== 'all' && p.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#896A50] font-semibold">
            Katalog Menu
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C]">
            Kelola Produk & Harga
          </h1>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34241C] hover:bg-[#221711] text-[#FFFCF7] text-xs font-semibold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#E5D8C7]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FCEBEB] border border-[#F0B8B8] rounded-xl text-xs text-[#B83E3E] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#FFFCF7] p-4 rounded-2xl border border-[#D8C9B7] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#896A50] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu atau deskripsi..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#69574A]">Kategori:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none flex-1 sm:flex-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE5] text-[#69574A] uppercase tracking-wider font-semibold border-b border-[#D8C9B7]">
              <tr>
                <th className="py-3 px-4">Foto & Menu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga (Rp)</th>
                <th className="py-3 px-4">Ketersediaan</th>
                <th className="py-3 px-4">Unggulan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C9B7]/50 text-[#34241C]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#69574A]">
                    Memuat daftar produk warkop...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#69574A]">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5EFE5]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#E5D8C7] border border-[#D8C9B7]/60 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-serif text-sm font-bold block truncate max-w-xs">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-[#69574A] line-clamp-1 max-w-xs mt-0.5">
                            {p.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-[#E5D8C7] text-[#34241C] text-[11px] font-medium">
                        {p.categoryName || categories.find((c) => c.id === p.categoryId)?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-sm whitespace-nowrap">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAvailability(p.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          p.isAvailable
                            ? 'bg-[#E8F2EA] text-[#3D784E] border-[#B8D8BF]'
                            : 'bg-[#FCEBEB] text-[#B83E3E] border-[#F0B8B8]'
                        }`}
                        title="Klik untuk ubah ketersediaan"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{p.isAvailable ? 'Tersedia' : 'Habis'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#C67D26] font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ya</span>
                        </span>
                      ) : (
                        <span className="text-[#69574A] text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-[#69574A] hover:text-[#34241C] hover:bg-[#E5D8C7] transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg text-[#69574A] hover:text-[#B83E3E] hover:bg-[#FCEBEB] transition-colors"
                          title="Hapus / Nonaktifkan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#FFFCF7] rounded-2xl border border-[#D8C9B7] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#D8C9B7] flex items-center justify-between bg-[#F5EFE5]">
              <h3 className="font-serif text-lg font-bold text-[#34241C]">
                {editingProduct ? 'Edit Data Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#69574A] hover:bg-[#E5D8C7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Nama Menu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Aren Spesial"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                    Kategori *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ceritakan cita rasa, bahan racikan, atau keunikan menu ini..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1">
                  URL Foto Produk *
                </label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] focus:outline-none focus:ring-1 focus:ring-[#896A50]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[#34241C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-[#34241C] focus:ring-[#896A50]"
                  />
                  <span>Tersedia untuk Dipesan</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#34241C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-[#34241C] focus:ring-[#896A50]"
                  />
                  <span>Menu Unggulan (Featured)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#D8C9B7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-[#69574A] hover:bg-[#E5D8C7]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#34241C] hover:bg-[#221711] disabled:opacity-50 text-[#FFFCF7] text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
