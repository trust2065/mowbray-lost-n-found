import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
