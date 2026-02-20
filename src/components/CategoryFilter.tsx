import React from 'react';
import { CATEGORIES } from '../constants';

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  availableCategories?: Set<string>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  setSelectedCategory,
  availableCategories
}) => {
  return (
    <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => setSelectedCategory('All')}
        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === 'All'
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
      >
        All Items
      </button>
      {CATEGORIES.map(cat => {
        const isAvailable = !availableCategories || availableCategories.has(cat);
        return (
          <button
            key={cat}
            disabled={!isAvailable}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
              ? 'bg-blue-600 text-white shadow-md'
              : !isAvailable
                ? 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-700 opacity-50'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
