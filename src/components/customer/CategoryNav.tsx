import React from 'react';
import type { Category } from '../../types';
import { Sparkles } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  hasFeatured?: boolean;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  hasFeatured = false,
}) => {
  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-[#F5EFE5]/95 backdrop-blur-md border-b border-[#D8C9B7] py-2.5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {/* Semua Menu */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-[#34241C] text-[#FFFCF7] shadow-sm'
                : 'bg-[#FFFCF7]/80 text-[#69574A] hover:bg-[#E5D8C7] hover:text-[#34241C] border border-[#D8C9B7]'
            }`}
          >
            Semua Menu
          </button>

          {/* Unggulan / Rekomendasi Barista */}
          {hasFeatured && (
            <button
              onClick={() => onSelectCategory('featured')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                selectedCategoryId === 'featured'
                  ? 'bg-[#896A50] text-[#FFFCF7] shadow-sm'
                  : 'bg-[#FFFCF7]/80 text-[#896A50] hover:bg-[#E5D8C7] border border-[#D8C9B7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unggulan Warkop</span>
            </button>
          )}

          {/* Dynamic Categories */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                selectedCategoryId === cat.id
                  ? 'bg-[#34241C] text-[#FFFCF7] shadow-sm'
                  : 'bg-[#FFFCF7]/80 text-[#69574A] hover:bg-[#E5D8C7] hover:text-[#34241C] border border-[#D8C9B7]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
