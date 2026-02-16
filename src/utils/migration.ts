import { getItems, updateItem } from '../services/firestore';
import { encodeImageToBlurhash } from './blurhash';

export const migrateBlurhashes = async () => {
  console.log('Starting blurhash migration...');
  try {
    const items = await getItems();
    console.log(`Found ${items.length} items to check.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      if (!item.imageUrls || item.imageUrls.length === 0) continue;

      // Check if blurhashes are missing or length doesn't match
      if (!item.blurhashes || item.blurhashes.length !== item.imageUrls.length) {
        console.log(`Generating blurhashes for item ${item.id} (${item.nameTag})...`);

        try {
          const blurhashes = await Promise.all(
            item.imageUrls.map(url => encodeImageToBlurhash(url))
          );

          await updateItem(item.id, { blurhashes });
          updatedCount++;
          console.log(`Updated item ${item.id} with ${blurhashes.length} blurhashes.`);
        } catch (err) {
          console.error(`Failed to update item ${item.id}:`, err);
          errorCount++;
        }
      }
    }

    alert(`Migration complete!\nUpdated: ${updatedCount} items\nErrors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    alert('Migration failed. Check console for details.');
  }
};
