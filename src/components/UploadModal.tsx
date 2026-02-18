import React from 'react';
import { X, Upload, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../constants';
import type { PendingItem } from '../types';
import { validateNameTag } from '../hooks/useFileUpload';
import { compressImage, needsCompression, formatFileSize, isFileTooLarge } from '../utils/imageCompression';
import { encodeImageToBlurhash } from '../utils/blurhash';

interface UploadModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  pendingItems: PendingItem[];
  onClose: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdatePendingField: <K extends keyof PendingItem>(index: number, field: K, value: PendingItem[K]) => void;
  onRemovePendingItem: (id: string) => void;
  onAutoFillItem: (index: number) => void;
  onConfirmUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  isAdmin,
  pendingItems,
  onClose,
  onFileSelect,
  onUpdatePendingField,
  onRemovePendingItem,
  onAutoFillItem,
  onConfirmUpload,
  fileInputRef
}) => {
  // Create a separate ref for the "add another item" button
  const addItemInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInitialFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (!target.files) return;

    const files = Array.from(target.files);

    // Restrict to 5 items maximum
    if (files.length > 5) {
      alert(`Maximum 5 items allowed. You selected ${files.length} files. Only the first 5 will be processed.`);
      // Reset input and re-trigger with only first 5 files
      const dt = new DataTransfer();
      files.slice(0, 5).forEach(file => dt.items.add(file));
      target.files = dt.files;
    }

    onFileSelect(e);
  };

  const handleAddAnotherItemFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (!target.files) return;

    const files = Array.from(target.files);
    const remainingCapacity = isAdmin ? 10 : 5;
    const currentItems = pendingItems.length;
    const maxAdditionalItems = remainingCapacity - currentItems;

    // Restrict to remaining capacity
    if (files.length > maxAdditionalItems) {
      alert(`You can only add ${maxAdditionalItems} more item(s). You selected ${files.length} files. Only the first ${maxAdditionalItems} will be processed.`);
      // Reset input and re-trigger with only allowed number of files
      const dt = new DataTransfer();
      files.slice(0, maxAdditionalItems).forEach(file => dt.items.add(file));
      target.files = dt.files;
    }

    onFileSelect(e);
  };

  const handleAddAnotherItem = () => {
    addItemInputRef.current?.click();
  };

  const handleAddMorePhotos = (item: PendingItem, index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*'; // Only accept images

    input.onchange = async (ev: Event) => {
      const target = ev.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files);
      const validFiles: File[] = [];
      const rejectedFiles: string[] = [];

      // Strictly filter for image files only
      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          rejectedFiles.push(file.name);
          return;
        }

        // Check if file is too large
        if (isFileTooLarge(file)) {
          rejectedFiles.push(`${file.name} (too large)`);
          return;
        }

        validFiles.push(file);
      });

      // Show feedback for rejected files
      if (rejectedFiles.length > 0) {
        const rejectedList = rejectedFiles.join(', ');
        alert(`The following files were rejected (only images allowed):\n${rejectedList}`);
      }

      // Process each valid image file
      for (const file of validFiles) {
        try {
          let imageDataUrl: string;

          if (needsCompression(file)) {
            console.log(`Compressing large image: ${file.name} (${formatFileSize(file.size)})`);
            const compressed = await compressImage(file);
            console.log(`Compressed ${file.name}: ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.fileSize)} (${(compressed.compressionRatio * 100).toFixed(1)}% reduction)`);
            imageDataUrl = compressed.dataUrl;
          } else {
            imageDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(file);
            });
          }

          let blurhash = '';
          try {
            blurhash = await encodeImageToBlurhash(imageDataUrl);
          } catch (e) {
            console.error('Failed to generate blurhash', e);
          }

          // Add the new image to the item
          onUpdatePendingField(index, 'imageUrls', [...item.imageUrls, imageDataUrl]);
          onUpdatePendingField(index, 'blurhashes', [...(item.blurhashes || []), blurhash]);
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
          alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update active preview to the last added image
      if (validFiles.length > 0) {
        onUpdatePendingField(index, 'activePreviewIdx', item.imageUrls.length);
      }
    };

    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl sm:rounded-6xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
        <div className="px-6 py-5 sm:px-10 sm:py-7 border-b dark:border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">Upload Photos</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              {isAdmin ? 'Staff Mode' : ``}
            </p>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-7 h-7 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
          {pendingItems.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-6xl p-20 text-center hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <Upload className="w-14 h-14 mx-auto text-slate-200 dark:text-slate-600 mb-5" />
              <p className="text-xl font-black text-slate-700 dark:text-slate-300">Select up to 5 photo(s)</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleInitialFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-10">
              {pendingItems.map((item, index) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-7 rounded-4xl shadow-xl flex flex-col sm:flex-row gap-8 relative border border-slate-100 dark:border-slate-700">
                  <div className="w-full sm:w-36 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Item {index + 1}
                    </div>
                    <div className="relative aspect-square rounded-4xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <img
                        src={item.imageUrls[item.activePreviewIdx]}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                    </div>
                    {item.imageUrls.length > 1 && (
                      <div className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span>{item.imageUrls.length}/{isAdmin ? 10 : 3}</span>
                        <span className="opacity-40">(max {isAdmin ? 10 : 3})</span>
                      </div>
                    )}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {item.imageUrls.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => onUpdatePendingField(index, 'activePreviewIdx', i)}
                          className={`w-10 h-10 shrink-0 cursor-pointer rounded-lg border-2 overflow-hidden ${item.activePreviewIdx === i ? 'border-blue-500' : 'border-transparent'
                            }`}
                        >
                          <img src={img} className="w-full h-full object-cover" alt="thumb" />
                        </div>
                      ))}
                      {item.imageUrls.length < (isAdmin ? 10 : 3) && (
                        <button
                          onClick={() => handleAddMorePhotos(item, index)}
                          className="w-10 h-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          id={`name-input-${index}`}
                          placeholder="Name on item"
                          className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={item.nameTag}
                          onChange={(e) => onUpdatePendingField(index, 'nameTag', e.target.value)}
                        />
                        {item.nameTag && !validateNameTag(item.nameTag).isValid && (
                          <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 p-1 rounded-full">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onAutoFillItem(index)}
                          disabled={item.isAnalyzing}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-sm whitespace-nowrap hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {item.isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Fill
                        </button>
                      )}
                      <button
                        onClick={() => onRemovePendingItem(item.id)}
                        className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 p-3 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.nameTag && !validateNameTag(item.nameTag).isValid && (
                      <div className="flex items-center gap-2 text-amber-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validateNameTag(item.nameTag).message}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-2 uppercase">Category</label>
                        <select
                          id={`category-select-${index}`}
                          className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all appearance-none"
                          value={item.category}
                          onChange={(e) => onUpdatePendingField(index, 'category', e.target.value)}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-2 uppercase">Location</label>
                        <select
                          id={`location-select-${index}`}
                          className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all appearance-none"
                          value={item.location}
                          onChange={(e) => onUpdatePendingField(index, 'location', e.target.value)}
                        >
                          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea
                      id={`description-input-${index}`}
                      placeholder="Description..."
                      className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-5 py-3 text-sm min-h-17.5 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      value={item.description}
                      onChange={(e) => onUpdatePendingField(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddAnotherItem}
                disabled={!isAdmin && pendingItems.length >= 5}
                className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-4xl text-slate-400 dark:text-slate-500 font-black text-sm hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add More Photos
              </button>
              <input
                type="file"
                ref={addItemInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleAddAnotherItemFileSelect}
              />
            </div>
          )}
        </div>

        {pendingItems.length > 0 && (
          <div className="p-8 border-t dark:border-slate-700 flex items-center gap-5">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Cancel</button>
            <button onClick={onConfirmUpload} className="flex-2 py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl shadow-2xl hover:shadow-blue-500/20 active:scale-95 transition-all">
              Post {pendingItems.length} Item(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
