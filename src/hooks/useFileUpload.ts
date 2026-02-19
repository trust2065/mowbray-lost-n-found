import React, { useRef } from 'react';
import type { PendingItem, Item } from '../types';
import { uploadMultipleImages } from '../services/storage';
import { addItem } from '../services/firestore';
import { compressImage, needsCompression, formatFileSize, isFileTooLarge } from '../utils/imageCompression';
import { encodeImageToBlurhash } from '../utils/blurhash';
import { getItemSearchText } from '../utils/vector';

// Validation helper for name tags
export const validateNameTag = (nameTag: string): { isValid: boolean; message?: string; } => {
  // Check for empty, null, or undefined
  if (!nameTag || nameTag.trim() === '') {
    return { isValid: false, message: 'Name cannot be empty' };
  }

  // Check for generic placeholder names
  const genericNames = ['unknown', 'item', 'unnamed', 'lost item', 'found item'];
  if (genericNames.includes(nameTag.toLowerCase().trim())) {
    return { isValid: false, message: 'Please provide a more specific name' };
  }

  // 1+ character names are valid
  return { isValid: true };
};

export const useFileUpload = (
  lastUsedCategory: string,
  lastUsedLocation: string,
  setLastUsedCategory: (category: string) => void,
  setLastUsedLocation: (location: string) => void,
  optimisticIdsRef: React.MutableRefObject<Set<string>>
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
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.warn('Skipping non-image file:', file.name);
        return;
      }

      // Check if file is too large
      if (isFileTooLarge(file)) {
        alert(`File ${file.name} is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(20 * 1024 * 1024)}.`);
        return;
      }

      // Check file size (warn if larger than 5MB)
      if (needsCompression(file)) {
        console.log(`Compressing large image: ${file.name} (${formatFileSize(file.size)})`);
      }

      // Process image (compress if needed)
      const processImage = async () => {
        try {
          let imageDataUrl: string;

          if (needsCompression(file)) {
            const compressed = await compressImage(file);
            console.log(`Compressed ${file.name}: ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.fileSize)} (${(compressed.compressionRatio * 100).toFixed(1)}% reduction)`);
            imageDataUrl = compressed.dataUrl;
          } else {
            const reader = new FileReader();
            imageDataUrl = await new Promise<string>((resolve, reject) => {
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

          // Add to pending items
          setPendingItems(prev => [...prev, {
            id: Math.random().toString(36).substring(2, 11),
            imageUrls: [imageDataUrl],
            blurhashes: [blurhash],
            nameTag: '',
            category: lastUsedCategory,
            description: '',
            location: lastUsedLocation,
            customLocation: '',
            isAnalyzing: false,
            activePreviewIdx: 0
          }]);
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
          alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      processImage();
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
    setShowSuccessToast: (show: boolean) => void,
    generateEmbedding: (text: string, taskType?: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') => Promise<number[] | null>,
    setItems?: React.Dispatch<React.SetStateAction<Item[]>>
  ): Promise<void> => {
    // Validate all items before upload
    const validationIssues = pendingItems.map((item, index) => {
      const validation = validateNameTag(item.nameTag);
      return {
        index,
        item,
        validation
      };
    }).filter(issue => !issue.validation.isValid);

    // If there are validation issues, show confirmation dialog
    if (validationIssues.length > 0) {
      const issueMessages = validationIssues.map(issue =>
        `Item ${issue.index + 1}: ${issue.validation.message}`
      ).join('\n');

      const proceedAnyway = confirm(
        `Some items have name issues:\n\n${issueMessages}\n\nContinue anyway?`
      );

      if (!proceedAnyway) {
        return; // User chose to go back and fix issues
      }
    }

    try {
      // Create optimistic items for immediate UI update
      const optimisticItems: Item[] = pendingItems.map((pendingItem, index) => ({
        id: `optimistic-${pendingItem.id}`,
        imageUrls: pendingItem.imageUrls,
        blurhashes: pendingItem.blurhashes,
        nameTag: pendingItem.nameTag,
        category: pendingItem.category,
        description: pendingItem.description,
        foundDate: new Date(Date.now() - index * 1000).toISOString(), // Stagger timestamps by 1 second
        location: pendingItem.location === 'Other' ? (pendingItem.customLocation || 'Other Area') : pendingItem.location
      }));

      // Add optimistic items to UI immediately
      if (setItems) {
        setItems(prevItems => [...optimisticItems, ...prevItems]);
      }

      // Close modal and show success immediately
      setPendingItems([]);
      setIsUploadModalOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Store optimistic IDs to prevent Firestore updates from refreshing them
      optimisticIdsRef.current = new Set(optimisticItems.map(item => item.id));

      // Upload all items to Firebase in background - DON'T update UI after
      const uploadPromises = pendingItems.map(async (pendingItem, index) => {
        try {
          // Convert data URLs to File objects for upload
          const imageFiles = await Promise.all(
            pendingItem.imageUrls.map(async (dataUrl, fileIndex) => {
              const response = await fetch(dataUrl);
              const blob = await response.blob();
              return new File([blob], `image-${fileIndex}.png`, { type: 'image/png' });
            })
          );

          // Upload images to Firebase Storage
          const imageUrls = await uploadMultipleImages(imageFiles, pendingItem.id);

          // Generate embedding for semantic search
          const searchText = getItemSearchText({
            nameTag: pendingItem.nameTag,
            category: pendingItem.category,
            description: pendingItem.description,
            location: pendingItem.location === 'Other' ? (pendingItem.customLocation || 'Other Area') : pendingItem.location
          });
          const embedding = await generateEmbedding(searchText, 'RETRIEVAL_DOCUMENT');

          // Create item for Firestore
          const itemData: Omit<Item, 'id'> = {
            imageUrls,
            blurhashes: pendingItem.blurhashes,
            nameTag: pendingItem.nameTag,
            category: pendingItem.category,
            description: pendingItem.description,
            foundDate: new Date(Date.now() - index * 1000).toISOString(), // Use staggered timestamp
            location: pendingItem.location === 'Other' ? (pendingItem.customLocation || 'Other Area') : pendingItem.location,
            embedding: embedding || undefined
          };

          const realId = await addItem(itemData);

          // Clean up optimistic ID after successful upload
          optimisticIdsRef.current.delete(optimisticItems[index].id);

          return { success: true, realId };
        } catch (error) {
          console.error('Failed to upload item:', pendingItem.id, error);
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Clean up all optimistic IDs after all uploads complete
      optimisticIdsRef.current.clear();

      // Only show errors, don't update UI to prevent refresh
      const failedItems = results.filter(r => !r.success);
      if (failedItems.length > 0) {
        alert(`${failedItems.length} item(s) failed to upload.`);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
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
