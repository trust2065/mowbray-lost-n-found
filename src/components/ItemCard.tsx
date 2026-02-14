import React from 'react';
import { Tag, MapPin, Calendar } from 'lucide-react';
import Gallery from './Gallery';
import type { Item, ViewMode } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: ViewMode;
  onPhotoClick: (urls: string[], index: number) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, viewMode, onPhotoClick }) => {
  return (
    <div className={
      viewMode === 'grid'
        ? "bg-white rounded-[2.5rem] overflow-hidden border hover:shadow-2xl transition-all"
        : "bg-white p-5 rounded-[2rem] border flex items-center gap-6"
    }>
      <div className={
        viewMode === 'grid'
          ? "aspect-[4/5] bg-slate-100"
          : "w-28 h-28 flex-shrink-0 rounded-[1.5rem] overflow-hidden"
      }>
        <Gallery urls={item.imageUrls} onPhotoClick={(index) => onPhotoClick(item.imageUrls, index)} />
      </div>
      <div className={viewMode === 'grid' ? "p-6" : "flex-1"}>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-base font-black text-slate-800 truncate">
            {item.nameTag || 'Unknown'}
          </span>
        </div>
        <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase inline-block mb-3">
          {item.category}
        </p>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">
          {item.description}
        </p>
        <div className="flex flex-col gap-2 pt-4 border-t text-[11px] text-slate-400 font-bold uppercase">
          <span className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {item.location}
          </span>
          <span className="flex items-center gap-2 font-medium">
            <Calendar className="w-3.5 h-3.5" /> Found {item.foundDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
