import {
  collection,
  addDoc,
  getDocs,
  getDoc,
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
  try {
    const collectionRef = collection(db, ITEMS_COLLECTION);

    const docRef = await addDoc(collectionRef, {
      ...item,
      foundDate: Timestamp.fromDate(new Date(item.foundDate))
    });

    // Immediately try to read it back
    await getDoc(docRef);

    return docRef.id;
  } catch (error) {
    console.error('Error saving item to Firestore:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
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

// Test item in the SAME collection as the main app
export const addMainCollectionTestItem = async () => {
  try {
    console.log('Adding test item to MAIN collection (lost-items)...');
    const testItem: Omit<Item, 'id'> = {
      imageUrls: [], // Empty array - no photos
      nameTag: 'Main Collection Test',
      category: 'School Hat',
      description: 'Test item in main collection without photos',
      foundDate: new Date().toISOString(),
      location: 'Basketball Court'
    };

    const docRef = await addDoc(collection(db, ITEMS_COLLECTION), testItem);
    console.log('Main collection test item saved with ID:', docRef.id);

    // Immediately read it back
    const savedDoc = await getDoc(docRef);
    console.log('Main collection test item exists:', savedDoc.exists());
    console.log('Main collection test item data:', savedDoc.data());

    return docRef.id;
  } catch (error) {
    console.error('Failed to add main collection test item:', error);
    throw error;
  }
};

// Simple text-only test
export const addSimpleTestItem = async () => {
  try {
    console.log('Adding SIMPLE test item (no photos)...');
    const simpleItem = {
      title: 'Simple Test',
      message: 'This is a simple test without photos',
      timestamp: new Date().toISOString()
    };

    // Use a different collection to avoid conflicts
    const docRef = await addDoc(collection(db, 'simple-test'), simpleItem);
    console.log('Simple test item saved with ID:', docRef.id);

    // Immediately read it back
    const savedDoc = await getDoc(docRef);
    console.log('Simple test item exists:', savedDoc.exists());
    console.log('Simple test item data:', savedDoc.data());

    return docRef.id;
  } catch (error) {
    console.error('Failed to add simple test item:', error);
    throw error;
  }
};

// Read simple test items with timeout
export const getSimpleTestItems = async (): Promise<any[]> => {
  try {
    console.log('Reading simple test items...');

    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore operation timed out after 10 seconds')), 10000);
    });

    const operationPromise = async () => {
      const q = query(collection(db, 'simple-test'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Simple test items found:', items);
      return items;
    };

    const items = await Promise.race([operationPromise(), timeoutPromise]);
    return items as any[];
  } catch (error) {
    console.error('Failed to read simple test items:', error);
    return [];
  }
};

// Test function to add a sample item
export const addTestItem = async () => {
  try {
    console.log('Adding test item...');
    const testItem: Omit<Item, 'id'> = {
      imageUrls: ['https://example.com/test.jpg'],
      nameTag: 'Test Item',
      category: 'School Hat',
      description: 'This is a test item',
      foundDate: new Date().toISOString(),
      location: 'Basketball Court'
    };

    const docId = await addItem(testItem);
    console.log('Test item added with ID:', docId);
    return docId;
  } catch (error) {
    console.error('Failed to add test item:', error);
    throw error;
  }
};

// Test Firestore connectivity
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firestore connectivity...');
    const startTime = Date.now();

    // Try to read a single document (even if it doesn't exist)
    const testDoc = doc(db, ITEMS_COLLECTION, 'test-connection');
    await getDoc(testDoc);

    const endTime = Date.now();
    console.log(`Firestore connectivity test passed in ${endTime - startTime}ms`);
    return true;
  } catch (error) {
    console.error('Firestore connectivity test failed:', error);
    if (error instanceof Error) {
      console.error('Connection error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code
      });
    }
    return false;
  }
};

// Test function to check if there are any items
export const checkItemsCount = async (): Promise<number> => {
  try {
    console.log('Starting checkItemsCount...');
    const startTime = Date.now();

    const q = query(collection(db, ITEMS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const endTime = Date.now();
    console.log(`checkItemsCount completed in ${endTime - startTime}ms`);
    console.log('Total items in Firestore:', querySnapshot.docs.length);

    return querySnapshot.docs.length;
  } catch (error) {
    console.error('Error checking items count:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code
      });
    }
    return 0;
  }
};

export const subscribeToItems = (callback: (items: Item[]) => void) => {
  const q = query(collection(db, ITEMS_COLLECTION), orderBy('foundDate', 'desc'));

  return onSnapshot(q,
    (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          foundDate: data.foundDate.toDate().toISOString()
        } as Item;
      });
      callback(items);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      // Return empty array on error to prevent UI from breaking
      callback([]);
    }
  );
};

// Smart subscription that completely pauses during optimistic updates
export const subscribeToItemsSmart = (
  callback: (items: Item[]) => void,
  optimisticIds: React.MutableRefObject<Set<string>>
) => {
  const q = query(collection(db, ITEMS_COLLECTION), orderBy('foundDate', 'desc'));

  return onSnapshot(q,
    (querySnapshot) => {
      // If there are optimistic items active, don't update to prevent refresh
      if (optimisticIds.current.size > 0) {
        console.log('Skipping Firestore update - optimistic items active');
        return;
      }

      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          foundDate: data.foundDate.toDate().toISOString()
        } as Item;
      });

      callback(items);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      callback([]);
    }
  );
};

// Delete all items and their photos
export const deleteAllItems = async (): Promise<void> => {
  try {
    console.log('Deleting all items and photos...');

    // Get all items first to collect image URLs
    const q = query(collection(db, ITEMS_COLLECTION));
    const querySnapshot = await getDocs(q);

    // Collect all image URLs from all items
    const allImageUrls: string[] = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        allImageUrls.push(...data.imageUrls);
      }
    });

    // Delete all Firestore items
    const deletePromises = querySnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
    console.log(`Deleted ${querySnapshot.docs.length} items from Firestore`);

    // Delete all photos from Firebase Storage
    if (allImageUrls.length > 0) {
      const { deleteAllPhotos } = await import('./storage');
      await deleteAllPhotos(allImageUrls);
      console.log(`Deleted ${allImageUrls.length} photos from Storage`);
    }

    console.log('All items and photos deleted successfully');
  } catch (error) {
    console.error('Error deleting all items and photos:', error);
    throw error;
  }
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
