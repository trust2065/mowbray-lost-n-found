# TODO List

## High Priority
- [ ] Minimize upload picture size/compression
- [ ] Set maximum photo size limit for uploads
- [ ] Fix 'add another item' button functionality
- [ ] Format found date to readable format (2026-02-14T00:00:00.000Z)
- [ ] Add item to list and close dialog immediately while submitting in background
- [ ] Fix items disappearing on page refresh - ensure proper Firebase persistence
- [ ] Rate Limiting：為了防止 Gemini API 被惡意刷爆，可以加上 express-rate-limit。
- [ ] Refine rule for storage bucket and firestore
- [ ] DO NOT refresh the photo after upload success

## Medium Priority
- [ ] Add test plan documentation
- [ ] Force item name validation - show reminder before submit (don't disable button)
- [ ] Prevent duplicate photos for same item
- [ ] Limit 'add more photo' button to photos only, exclude selected items
- [ ] Move trash button from picture to the item itself
- [ ] Remove the guest mode wording
- [ ] Specify what can be searched in search functionality
- [ ] Zustand Store

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
