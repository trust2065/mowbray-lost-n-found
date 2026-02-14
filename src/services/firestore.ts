import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Item } from '../types';

const ITEMS_COLLECTION = 'lost-items';

export const addItem = async (item: Omit<Item, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
    ...item,
    foundDate: Timestamp.fromDate(new Date(item.foundDate))
  });
  return docRef.id;
};

export const getItems = async (): Promise<Item[]> => {
  const q = query(collection(db, ITEMS_COLLECTION), orderBy('foundDate', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      foundDate: data.foundDate.toDate().toISOString()
    } as Item;
  });
};

export const subscribeToItems = (callback: (items: Item[]) => void) => {
  const q = query(collection(db, ITEMS_COLLECTION), orderBy('foundDate', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        foundDate: data.foundDate.toDate().toISOString()
      } as Item;
    });
    callback(items);
  });
};

export const deleteItem = async (itemId: string): Promise<void> => {
  await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
};

export const updateItem = async (itemId: string, updates: Partial<Item>): Promise<void> => {
  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  const updateData = {
    ...updates,
    ...(updates.foundDate && { foundDate: Timestamp.fromDate(new Date(updates.foundDate)) })
  };
  await updateDoc(docRef, updateData);
};
