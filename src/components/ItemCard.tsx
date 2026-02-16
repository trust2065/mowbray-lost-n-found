import React, { memo, useState } from 'react';
import { Tag, MapPin, Calendar, ImageIcon, ChevronUp } from 'lucide-react';
import Gallery from './Gallery';
import type { Item, ViewMode } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: ViewMode;
  onPhotoClick: (urls: string[], index: number) => void;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, viewMode, onPhotoClick }) => {
  const [showMobileImage, setShowMobileImage] = useState(false);

  return (
    <div className={
      viewMode === 'grid'
        ? "bg-white dark:bg-slate-800 rounded-4xl overflow-hidden border dark:border-slate-700 hover:shadow-2xl transition-all"
        : "bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-4xl border dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6"
    }>
      <div className={
        viewMode === 'grid'
          ? "aspect-4/5 bg-slate-100 dark:bg-slate-900"
          : `${showMobileImage ? 'block' : 'hidden'} sm:block w-full h-48 sm:w-28 sm:h-28 shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900`
      }>
        <Gallery urls={item.imageUrls} onPhotoClick={(index) => onPhotoClick(item.imageUrls, index)} />
      </div>
      <div className={viewMode === 'grid' ? "p-4 sm:p-6" : "flex-1 min-w-0 w-full"}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 overflow-hidden">
            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
              {item.nameTag || 'Unknown'}
            </span>
          </div>

          {/* Mobile Image Toggle Button (List Mode Only) */}
          {viewMode === 'list' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMobileImage(!showMobileImage);
              }}
              className="sm:hidden p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 active:scale-95 transition-transform"
              aria-label={showMobileImage ? "Hide photo" : "Show photo"}
            >
              {showMobileImage ? <ChevronUp className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg uppercase inline-block mb-3">
          {item.category}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium">
          {item.description}
        </p>
        <div className="flex flex-col gap-2 pt-4 border-t dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase">
          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {item.location}
          </span>
          <hr className="border-slate-200 dark:border-slate-700" />
          <span className="flex items-center gap-2 font-medium">
            <Calendar className="w-3.5 h-3.5" /> Found on {new Date(item.foundDate).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}, {new Date(item.foundDate).toLocaleTimeString('en-AU', {
              hour: 'numeric',
              hour12: true
            })}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when item ID or viewMode changes
  return prevProps.item.id === nextProps.item.id &&
    prevProps.viewMode === nextProps.viewMode;
});

export default ItemCard;
