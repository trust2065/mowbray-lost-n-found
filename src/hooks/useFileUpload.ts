import React, { useRef, useCallback, useMemo } from 'react';
import { addItem } from '../services/firestore';
import type { PendingItem, Item } from '../types';
import { CategorySchema, LocationSchema } from '../types';
import { compressImage, needsCompression, isFileTooLarge } from '../utils/imageCompression';
import { encodeImageToBlurhash } from '../utils/blurhash';

export const validateNameTag = (name: string): { isValid: boolean; message?: string; } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: "Name cannot be empty" };
  }
  return { isValid: true };
};

export const useFileUpload = (
  lastUsedCategory: string,
  lastUsedLocation: string,
  setLastUsedCategory: (category: string) => void,
  setLastUsedLocation: (location: string) => void,
  optimisticIdsRef: React.MutableRefObject<Set<string>>,
  setIsSyncing: (isSyncing: boolean) => void
) => {
  const activeReaders = useRef<Set<FileReader>>(new Set());

  const cleanupReaders = useCallback(() => {
    activeReaders.current.forEach((reader: FileReader) => {
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    });
    activeReaders.current.clear();
  }, []);

  const handleFileSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    isAdmin: boolean,
    currentPendingItems: PendingItem[]
  ): void => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!isAdmin && (currentPendingItems.length + files.length) > 5) {
      alert("Safety Guard: Max 5 items per upload for guests.");
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (isFileTooLarge(file)) {
        alert(`File ${file.name} is too large. Max size 20MB.`);
        return;
      }

      const processImage = async () => {
        try {
          let imageDataUrl: string;
          if (needsCompression(file)) {
            const compressed = await compressImage(file);
            imageDataUrl = compressed.dataUrl;
          } else {
            const reader = new FileReader();
            activeReaders.current.add(reader);
            imageDataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(file);
            });
            activeReaders.current.delete(reader);
          }

          let blurhash = '';
          try {
            blurhash = await encodeImageToBlurhash(imageDataUrl);
          } catch (e) {
            console.error('Blurhash failed', e);
          }

          // Validate initial category/location against schemas
          const categoryResult = CategorySchema.safeParse(lastUsedCategory);
          const locationResult = LocationSchema.safeParse(lastUsedLocation);

          const newItem: PendingItem = {
            id: Math.random().toString(36).substring(2, 11),
            imageUrls: [imageDataUrl],
            blurhashes: [blurhash],
            nameTag: '',
            category: categoryResult.success ? categoryResult.data : CategorySchema.options[0],
            location: locationResult.success ? locationResult.data : LocationSchema.options[0],
            description: '',
            isAnalyzing: false,
            activePreviewIdx: 0
          };

          setPendingItems(prev => [...prev, newItem]);
        } catch (error) {
          console.error('File process error:', error);
        }
      };
      processImage();
    });

    if (e.target) e.target.value = '';
  }, [lastUsedCategory, lastUsedLocation]);

  const updatePendingField = useCallback(<K extends keyof PendingItem>(
    index: number,
    field: K,
    value: PendingItem[K],
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>
  ): void => {
    setPendingItems(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
        if (field === 'category') setLastUsedCategory(value as string);
        if (field === 'location') setLastUsedLocation(value as string);
      }
      return next;
    });
  }, [setLastUsedCategory, setLastUsedLocation]);

  const removePendingItem = useCallback((
    id: string,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    onRemove?: (id: string) => void
  ): void => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
    if (onRemove) onRemove(id);
  }, []);

  const confirmUpload = useCallback(async (
    pendingItems: PendingItem[],
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    setIsUploadModalOpen: (open: boolean) => void,
    setShowSuccessToast: (show: boolean) => void,
    isAdmin: boolean,
    generateEmbedding: (text: string) => Promise<number[] | null>
  ): Promise<void> => {
    for (const item of pendingItems) {
      if (!validateNameTag(item.nameTag).isValid) {
        alert(`Validation error: ${validateNameTag(item.nameTag).message}`);
        return;
      }
    }

    try {
      const optimisticItems = [...pendingItems];
      setPendingItems([]);
      setIsUploadModalOpen(false);
      setShowSuccessToast(true);

      optimisticIdsRef.current = new Set(optimisticItems.map(item => item.id));
      setIsSyncing(true);

      const uploadPromises = optimisticItems.map(async (pendingItem, index) => {
        try {
          const { getItemSearchText } = await import('../utils/vector');
          const searchText = getItemSearchText({
            nameTag: pendingItem.nameTag,
            category: pendingItem.category,
            description: pendingItem.description,
            location: pendingItem.location
          });

          const embedding = await generateEmbedding(searchText);

          const itemData: Omit<Item, 'id'> = {
            imageUrls: pendingItem.imageUrls,
            blurhashes: pendingItem.blurhashes || [],
            nameTag: pendingItem.nameTag,
            category: pendingItem.category,
            description: pendingItem.description,
            foundDate: new Date(Date.now() - index * 60000).toISOString(),
            location: pendingItem.location === 'Other' ? (pendingItem.customLocation || 'Other Area') : pendingItem.location,
          };

          if (embedding && embedding.length > 0) {
            itemData.embedding = embedding;
          }

          const realId = await addItem(itemData);
          optimisticIdsRef.current.delete(pendingItem.id);
          return { success: true, realId };
        } catch (error) {
          console.error('Upload error:', error, isAdmin);
          return { success: false };
        }
      });

      await Promise.all(uploadPromises);
      optimisticIdsRef.current.clear();
      setIsSyncing(false);
    } catch (error) {
      console.error('Upload process failed:', error);
    }
  }, [setIsSyncing, optimisticIdsRef]);

  const closeAndCancelAll = useCallback((
    abortControllers: React.MutableRefObject<Map<string, AbortController>>,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    setIsUploadModalOpen: (open: boolean) => void
  ): void => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();
    setPendingItems([]);
    setIsUploadModalOpen(false);
  }, []);

  return useMemo(() => ({
    handleFileSelect,
    updatePendingField,
    removePendingItem,
    confirmUpload,
    closeAndCancelAll,
    cleanupReaders
  }), [handleFileSelect, updatePendingField, removePendingItem, confirmUpload, closeAndCancelAll, cleanupReaders]);
};
