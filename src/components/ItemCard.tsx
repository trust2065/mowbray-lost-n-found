import React, { memo, useState } from 'react';
import { MapPin, Calendar, Trash2 } from 'lucide-react';
import { Blurhash } from 'react-blurhash';
import Gallery from './Gallery';
import type { Item, ViewMode } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: ViewMode;
  isAdmin?: boolean;
  onPhotoClick: (urls: string[], index: number) => void;
  onDelete?: (id: string) => void;
  similarity?: number;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, viewMode, isAdmin, onPhotoClick, onDelete, similarity }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset loaded state if image changes (unlikely for existing item but good practice)
  React.useEffect(() => {
    if (viewMode === 'list') {
      const img = new Image();
      img.src = item.imageUrls[0];
      if (img.complete) setImgLoaded(true);
    }
  }, [item.imageUrls, viewMode]);

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
          <Gallery
            urls={item.imageUrls}
            blurhashes={item.blurhashes}
            onPhotoClick={(index) => onPhotoClick(item.imageUrls, index)}
          />
        ) : (
          <>
            {item.blurhashes?.[0] && !imgLoaded && (
              <div className="absolute inset-0 z-10">
                <Blurhash
                  hash={item.blurhashes[0]}
                  width="100%"
                  height="100%"
                  resolutionX={32}
                  resolutionY={32}
                  punch={1}
                />
              </div>
            )}
            <img
              src={item.imageUrls[0]}
              alt={item.nameTag}
              className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => onPhotoClick(item.imageUrls, 0)}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        )}
      </div>

      <div className={viewMode === 'grid' ? "p-4" : "flex-1 min-w-0 flex flex-col justify-center"}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${viewMode === 'grid' ? 'text-lg mb-1' : 'text-base mb-0.5'}`}>
              {item.nameTag || 'Unknown Item'}
            </h3>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-2">
              {item.category}
              {similarity !== undefined && similarity > 0 && (
                <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-black animate-pulse">
                  {Math.round(similarity * 100)}% Match
                </span>
              )}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.foundDate).toLocaleDateString()}</span>
                </div>
                {isAdmin && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Mark this item as deleted?')) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {viewMode === 'list' && isAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Mark this item as deleted?')) {
              onDelete(item.id);
            }
          }}
          className="mr-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when item ID, viewMode, or admin status changes
  return prevProps.item.id === nextProps.item.id &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.similarity === nextProps.similarity &&
    prevProps.isAdmin === nextProps.isAdmin;
});

export default ItemCard;
