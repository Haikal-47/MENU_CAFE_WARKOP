import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import type { Category, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { CategoryNav } from '../../components/customer/CategoryNav';
import { ProductCard } from '../../components/customer/ProductCard';
import { ProductDetailModal } from '../../components/customer/ProductDetailModal';
import { CartDrawer } from '../../components/customer/CartDrawer';
import { TableSelectorModal } from '../../components/customer/TableSelectorModal';
import { Search, Sparkles, ShoppingBag, ArrowRight, MapPin, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export const MenuPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token: urlParamToken } = useParams<{ token?: string }>();
  const queryToken = searchParams.get('table') || urlParamToken;

  const {
    items: cartItems,
    addItem,
    tableNumber,
    tableToken,
    locationNote,
    setTableInfo,
    totalItems,
    totalAmount,
  } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductForModal, setActiveProductForModal] = useState<Product | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableNotice, setTableNotice] = useState<string | null>(null);

  // 1. Resolve Table from QR Code query/route parameter
  useEffect(() => {
    if (queryToken && queryToken !== tableToken) {
      resolveTableToken(queryToken);
    }
  }, [queryToken]);

  const resolveTableToken = async (token: string) => {
    try {
      const res = await fetch(`/api/menu/table/${token}`);
      const data = await res.json();
      if (res.ok && data.table) {
        setTableInfo(data.table.qrToken, data.table.tableNumber, data.table.locationNote);
        setTableNotice(`Selamat menikmati! Anda terhubung ke Meja ${data.table.tableNumber}.`);
      } else {
        setError(data.error || 'Kode QR Meja tidak valid.');
      }
    } catch {
      setError('Koneksi terputus saat membaca data meja.');
    }
  };

  // 2. Fetch Menu
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setFeaturedProducts(data.featuredProducts || []);
        } else {
          setError('Gagal memuat menu dari server.');
        }
      } catch (err) {
        setError('Koneksi server bermasalah.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list: Product[] = [];

    if (selectedCategory === 'all') {
      categories.forEach((cat) => {
        if (cat.products) list.push(...cat.products);
      });
    } else if (selectedCategory === 'featured') {
      list = featuredProducts;
    } else {
      const foundCat = categories.find((c) => c.id === selectedCategory);
      if (foundCat && foundCat.products) {
        list = foundCat.products;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [categories, featuredProducts, selectedCategory, searchQuery]);

  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-[#F5EFE5] flex flex-col selection:bg-[#34241C] selection:text-[#F5EFE5]">
      {/* Header */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onSelectTable={() => setIsTableModalOpen(true)}
      />

      {/* Table notification toast */}
      {tableNotice && (
        <div className="bg-[#E8F2EA] border-b border-[#B8D8BF] px-4 py-2 text-xs text-[#3D784E] text-center flex items-center justify-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{tableNotice}</span>
          <button
            onClick={() => setTableNotice(null)}
            className="underline ml-2 text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hero Editorial Section */}
      <section className="bg-[#34241C] text-[#FFFCF7] pt-10 pb-12 px-4 border-b border-[#896A50]/40 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#E5D8C7] font-semibold bg-[#896A50]/40 px-3 py-1 rounded-full inline-block mb-3">
                QR Order & Instant Service
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#FFFCF7] leading-tight">
                Seduhan Kopi Nusantara & Santapan Warkop Pilihan
              </h1>
              <p className="text-xs sm:text-sm text-[#E5D8C7]/90 mt-3 leading-relaxed max-w-xl">
                Nikmati waktu nongkrong Anda tanpa perlu mengantre di kasir. Pilih menu favorit, sesuaikan gula & es, dan pesanan akan langsung diantar ke meja Anda.
              </p>
            </div>

            {/* Current Table Indicator Card */}
            <div className="bg-[#FFFCF7]/10 backdrop-blur-xs p-4 rounded-xl border border-[#E5D8C7]/20 shrink-0 min-w-[220px]">
              <span className="text-[11px] uppercase tracking-wider text-[#E5D8C7] block mb-1">
                Posisi Pesanan
              </span>
              {tableNumber ? (
                <div>
                  <div className="font-serif text-2xl font-bold text-[#FFFCF7]">
                    Meja #{tableNumber}
                  </div>
                  {locationNote && (
                    <div className="text-xs text-[#E5D8C7]/80 mt-0.5">{locationNote}</div>
                  )}
                  <button
                    onClick={() => setIsTableModalOpen(true)}
                    className="text-[11px] text-[#E5D8C7] hover:underline mt-2 block"
                  >
                    Ganti nomor meja &rarr;
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-[#E5D8C7]">Belum ada meja dipilih</span>
                  <button
                    onClick={() => setIsTableModalOpen(true)}
                    className="mt-2 w-full py-2 px-3 rounded-lg bg-[#E5D8C7] text-[#34241C] text-xs font-semibold hover:bg-[#FFFCF7] transition-colors"
                  >
                    Tentukan Meja Anda
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-[#896A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi susu, v60, indomie nyemek, roti bakar..."
                className="w-full bg-[#FFFCF7] text-[#34241C] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C9B7] placeholder-[#69574A]/60 focus:outline-none focus:ring-2 focus:ring-[#896A50]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#69574A] hover:text-[#34241C]"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Horizontal Navigation */}
      <CategoryNav
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
        hasFeatured={featuredProducts.length > 0}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#896A50] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-[#69574A] font-medium">
              Menyiapkan racikan menu warkop...
            </p>
          </div>
        ) : error ? (
          <div className="bg-[#FCEBEB] border border-[#F0B8B8] p-6 rounded-xl text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-[#B83E3E] mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold text-[#B83E3E]">
              Kendala Memuat Menu
            </h3>
            <p className="text-xs text-[#69574A] mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-[#34241C] text-[#FFFCF7] text-xs font-semibold"
            >
              Muat Ulang Halaman
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-[#69574A]">
            <p className="text-sm">Tidak ada menu yang sesuai dengan pencarian Anda.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs underline text-[#34241C] font-semibold"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        ) : (
          <div>
            {/* Header category name */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#D8C9B7]/60">
              <div className="flex items-center gap-2">
                {selectedCategory === 'featured' && <Sparkles className="w-4 h-4 text-[#896A50]" />}
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#34241C]">
                  {selectedCategory === 'all'
                    ? 'Semua Pilihan Menu'
                    : selectedCategory === 'featured'
                    ? 'Menu Unggulan Rekomendasi Barista'
                    : categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
              </div>
              <span className="text-xs text-[#69574A]">
                {filteredProducts.length} pilihan
              </span>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={cartQuantityMap.get(product.id) || 0}
                  onQuickAdd={(p) => addItem(p, 1)}
                  onOpenDetail={(p) => setActiveProductForModal(p)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar for Mobile when cart has items */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-[#34241C] text-[#FFFCF7] rounded-xl shadow-lg border border-[#896A50]/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#C67D26] text-white text-xs font-bold flex items-center justify-center">
                {totalItems}
              </div>
              <div className="text-left">
                <span className="text-xs text-[#E5D8C7] block leading-none">
                  Pesanan Anda
                </span>
                <span className="font-serif text-sm font-bold text-[#FFFCF7]">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E5D8C7]">
              <span>Lihat Keranjang</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Product Detail / Customizer Modal */}
      <ProductDetailModal
        product={activeProductForModal}
        onClose={() => setActiveProductForModal(null)}
        onAddToCart={(prod, qty, notes) => addItem(prod, qty, notes)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onSelectTable={() => {
          setIsCartOpen(false);
          setIsTableModalOpen(true);
        }}
      />

      {/* Table Selector Modal */}
      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
