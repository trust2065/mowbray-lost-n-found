import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export const uploadImageToFirebase = async (file: File, itemId: string): Promise<string> => {
  const storageRef = ref(storage, `lost-items/${itemId}/${Date.now()}-${file.name}`);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

export const uploadMultipleImages = async (files: File[], itemId: string): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadImageToFirebase(file, itemId));
  return Promise.all(uploadPromises);
};

// Delete multiple photos from Firebase Storage
export const deleteAllPhotos = async (imageUrls: string[]): Promise<void> => {
  try {
    console.log(`Deleting ${imageUrls.length} photos from Storage...`);

    const deletePromises = imageUrls.map(async (imageUrl) => {
      try {
        // Extract file path from URL
        const url = new URL(imageUrl);
        const filePath = decodeURIComponent(url.pathname.split('/o/')[1]);
        const storageRef = ref(storage, filePath);

        await deleteObject(storageRef);
        console.log(`Deleted photo: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete photo: ${imageUrl}`, error);
        // Continue with other photos even if one fails
      }
    });

    await Promise.all(deletePromises);
    console.log('All photos deleted successfully');
  } catch (error) {
    console.error('Error deleting photos:', error);
    throw error;
  }
};
