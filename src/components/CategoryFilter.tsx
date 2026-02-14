import React from 'react';
import { CATEGORIES } from '../constants';

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  setSelectedCategory
}) => {
  return (
    <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button 
        onClick={() => setSelectedCategory('All')} 
        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap ${
          selectedCategory === 'All' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'
        }`}
      >
        All Items
      </button>
      {CATEGORIES.map(cat => (
        <button 
          key={cat} 
          onClick={() => setSelectedCategory(cat)} 
          className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap ${
            selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
