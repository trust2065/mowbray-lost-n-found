import React, { useRef } from 'react';
import type { PendingItem, Item } from '../types';
import { uploadMultipleImages } from '../services/storage';
import { addItem } from '../services/firestore';

export const useFileUpload = (
  lastUsedCategory: string,
  lastUsedLocation: string,
  setLastUsedCategory: (category: string) => void,
  setLastUsedLocation: (location: string) => void
) => {
  // Store active FileReaders for cleanup
  const activeReaders = useRef<Set<FileReader>>(new Set());

  // Cleanup function for FileReaders
  const cleanupReaders = () => {
    activeReaders.current.forEach((reader: FileReader) => {
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    });
    activeReaders.current.clear();
  };
  const handleFileSelect = (
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
      const reader = new FileReader();
      activeReaders.current.add(reader);

      reader.onloadend = () => {
        activeReaders.current.delete(reader);
        setPendingItems(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          imageUrls: [reader.result as string],
          nameTag: '',
          category: lastUsedCategory,
          description: '',
          location: lastUsedLocation,
          customLocation: '',
          isAnalyzing: false,
          activePreviewIdx: 0
        }]);
      };

      reader.onerror = () => {
        activeReaders.current.delete(reader);
        console.error('FileReader error for file:', file.name);
      };

      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const updatePendingField = <K extends keyof PendingItem>(
    index: number,
    field: K,
    value: PendingItem[K],
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>
  ): void => {
    if (field === 'category') setLastUsedCategory(value as string);
    if (field === 'location') setLastUsedLocation(value as string);

    setPendingItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removePendingItem = (
    id: string,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    cancelAiFill: (itemId: string) => void
  ): void => {
    cancelAiFill(id);
    setPendingItems(prev => prev.filter(item => item.id !== id));
  };

  const confirmUpload = async (
    pendingItems: PendingItem[],
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    setIsUploadModalOpen: (open: boolean) => void,
    setShowSuccessToast: (show: boolean) => void
  ): Promise<void> => {
    try {
      const now = new Date().toISOString().split('T')[0];

      // Upload all items to Firebase
      const uploadPromises = pendingItems.map(async (pendingItem) => {
        // Convert data URLs to File objects for upload
        const imageFiles = await Promise.all(
          pendingItem.imageUrls.map(async (dataUrl, index) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            return new File([blob], `image-${index}.png`, { type: 'image/png' });
          })
        );

        // Upload images to Firebase Storage
        const imageUrls = await uploadMultipleImages(imageFiles, pendingItem.id);

        // Create item for Firestore
        const itemData: Omit<Item, 'id'> = {
          imageUrls,
          nameTag: pendingItem.nameTag,
          category: pendingItem.category,
          description: pendingItem.description,
          foundDate: now,
          location: pendingItem.location === 'Other' ? (pendingItem.customLocation || 'Other Area') : pendingItem.location
        };

        return addItem(itemData);
      });

      await Promise.all(uploadPromises);

      setPendingItems([]);
      setIsUploadModalOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const closeAndCancelAll = (
    abortControllers: React.MutableRefObject<Map<string, AbortController>>,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    setIsUploadModalOpen: (open: boolean) => void
  ): void => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    setPendingItems([]);
    setIsUploadModalOpen(false);
  };

  return {
    handleFileSelect,
    updatePendingField,
    removePendingItem,
    confirmUpload,
    closeAndCancelAll,
    cleanupReaders
  };
};
