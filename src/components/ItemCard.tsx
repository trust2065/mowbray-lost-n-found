import React, { memo } from 'react';
import { MapPin, Calendar } from 'lucide-react';
import Gallery from './Gallery';
import type { Item, ViewMode } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: ViewMode;
  onPhotoClick: (urls: string[], index: number) => void;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, viewMode, onPhotoClick }) => {
  return (
    <div className={
      viewMode === 'grid'
        ? "group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700 hover:shadow-lg transition-all duration-300"
        : "group bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 flex flex-row items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    }>
      {/* Mobile Image Logic for List View: Always show small thumbnail on list view instead of toggle */}
      <div className={
        viewMode === 'grid'
          ? "aspect-4/5 bg-slate-100 dark:bg-slate-900 relative overflow-hidden"
          : "w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 relative"
      }>
         {/* Use Gallery for Grid view to allow swiping, simple img for compact List view */}
         {viewMode === 'grid' ? (
          <Gallery urls={item.imageUrls} onPhotoClick={(index) => onPhotoClick(item.imageUrls, index)} />
        ) : (
          <img 
            src={item.imageUrls[0]} 
            alt={item.nameTag}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onClick={() => onPhotoClick(item.imageUrls, 0)}
          />
        )}
      </div>

      <div className={viewMode === 'grid' ? "p-4" : "flex-1 min-w-0 flex flex-col justify-center"}>
        <div className="flex items-start justify-between gap-2">
          <div>
             <h3 className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${viewMode === 'grid' ? 'text-lg mb-1' : 'text-base mb-0.5'}`}>
              {item.nameTag || 'Unknown Item'}
            </h3>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize">
              {item.category}
            </p>
          </div>
          
          {viewMode === 'list' && (
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                {new Date(item.foundDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block">
                {item.location}
              </span>
            </div>
          )}
        </div>

        {viewMode === 'grid' && (
          <>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(item.foundDate).toLocaleDateString()}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when item ID or viewMode changes
  return prevProps.item.id === nextProps.item.id &&
    prevProps.viewMode === nextProps.viewMode;
});

export default ItemCard;
