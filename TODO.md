# TODO List

## High Priority
- [x] Minimize upload picture size/compression
- [x] Set maximum photo size limit for uploads
- [x] Fix 'add another item' button functionality
- [x] Format found date to readable format
- [x] Add item to list and close dialog immediately while submitting in background
- [x] Fix items disappearing on page refresh - ensure proper Firebase persistence
- [x] Rate Limiting：為了防止 Gemini API 被惡意刷爆，可以加上 express-rate-limit。
- [x] DO NOT refresh the photo after upload success
- [x] Image Cache (be aware of the network tab 'disable cache')
- [x] Paging
- [x] Mobile first
- [x] Dark mode

## Medium Priority
- [x] Add test
- [x] Force item name validation - show reminder before submit (don't disable button)
- [ignore] Prevent duplicate photos for same item
- [x] Limit 'add more photo' button to photos only, exclude selected items
- [x] Move trash button from picture to the item itself
- [x] Remove the guest mode wording
- [x] Specify what can be searched in search functionality
- [x] Zustand Store
- [x] Make AI refill work again in dev/prod (when goes to prod, i move the folder to /api and change the endpoint from localhost to /api)
- [x] **Data Validation**: Integrate `Zod` for runtime schema validation to ensure database data strictly matches our `Category` and `Location` types.
- [ ] **CI/CD Integration**: Setup GitHub Actions to automatically run Playwright E2E and Vitest unit tests on every Push.
- [ ] **Smart Search (RAG)**: Implement vector search (using embeddings) to allow natural language queries like "that blue jacket with the yellow zipper."

## Before release
- [ ] Refine rule for storage bucket and firestore

## Details

### Image Upload Improvements
- **Minimize upload picture size/compression**: Implement client-side image compression before upload
- **Set maximum photo size limit**: Add file size validation and user feedback
- **Prevent duplicate photos**: Check for duplicate images within the same item
- **Limit photo selection**: Ensure 'add more photo' only accepts image files, not other items

### UI/UX Improvements
- **Fix 'add another item' button**: Currently not functioning properly
- **Item name validation**: Show reminder/warning if name is empty, but don't disable submit
- **Move trash button**: Delete button should be on the item level, not individual photos
- **Remove guest mode wording**: Clean up UI text
- **Format found date**: Convert ISO format to readable date format
- **Optimistic UI updates**: Add item to list and close dialog immediately, handle failures gracefully
- **Fix persistence issue**: Items disappear on page refresh - ensure Firebase data loads properly
- **Search functionality**: Clearly specify what fields can be searched (name, description, location) and show search hints

### Documentation
- **Add test plan**: Create comprehensive testing documentation for the application
