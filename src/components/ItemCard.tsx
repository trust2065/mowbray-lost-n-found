import React, { memo, useState } from 'react';
import { MapPin, Calendar, Trash2, Pencil, Check, X } from 'lucide-react';
import { Blurhash } from 'react-blurhash';
import Gallery from './Gallery';
import { CATEGORIES, LOCATIONS } from '../constants';
import type { Item, ViewMode } from '../types';

interface ItemCardProps {
  item: Item;
  viewMode: ViewMode;
  isAdmin?: boolean;
  onPhotoClick: (urls: string[], index: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Item>) => void;
  similarity?: number;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, viewMode, isAdmin, onPhotoClick, onDelete, onEdit, similarity }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nameTag: item.nameTag,
    category: item.category,
    description: item.description,
    location: item.location,
  });

  React.useEffect(() => {
    if (viewMode === 'list') {
      const img = new Image();
      img.src = item.imageUrls[0];
      if (img.complete) setImgLoaded(true);
    }
  }, [item.imageUrls, viewMode]);

  const handleSave = () => {
    onEdit?.(item.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      nameTag: item.nameTag,
      category: item.category,
      description: item.description,
      location: item.location,
    });
    setIsEditing(false);
  };

  const editActions = isEditing ? (
    <>
      <button
        onClick={handleSave}
        className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Edit item"
      >
        <Pencil className="w-4 h-4" />
      </button>
      {onDelete && (
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
    </>
  );

  return (
    <div className={
      viewMode === 'grid'
        ? "group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700 hover:shadow-lg transition-all duration-300"
        : "group bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 flex flex-row items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    }>
      <div className={
        viewMode === 'grid'
          ? "aspect-4/5 bg-slate-100 dark:bg-slate-900 relative overflow-hidden"
          : "w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 relative"
      }>
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
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editData.nameTag}
                onChange={(e) => setEditData(prev => ({ ...prev, nameTag: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-lg px-2 py-1 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <h3 className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${viewMode === 'grid' ? 'text-lg mb-1' : 'text-base mb-0.5'}`}>
                {item.nameTag || 'Unknown Item'}
              </h3>
            )}
            {isEditing ? (
              <select
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-lg px-2 py-1 text-xs font-medium mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-2">
                {item.category}
                {similarity !== undefined && similarity > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-black animate-pulse">
                    {Math.round(similarity * 100)}% Match
                  </span>
                )}
              </p>
            )}
          </div>

          {viewMode === 'list' && !isEditing && (
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
          <div className="mt-3 space-y-2">
            {isEditing ? (
              <>
                <select
                  value={editData.location}
                  onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-lg px-2 py-1 text-xs min-h-[3rem] resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Description..."
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{item.location}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{item.description}</p>
                )}
              </>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(item.foundDate).toLocaleDateString()}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  {editActions}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'list' && isAdmin && (
        <div className="flex items-center gap-1 mr-2">
          {editActions}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
    prevProps.item.nameTag === nextProps.item.nameTag &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.location === nextProps.item.location &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.similarity === nextProps.similarity &&
    prevProps.isAdmin === nextProps.isAdmin;
});

export default ItemCard;
