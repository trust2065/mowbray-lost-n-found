---
name: image_pipeline
description: Browser-side image processing pipeline including compression, blurhash generation, and EXIF date extraction.
---

# Image Pipeline Skill

## Problem
User-uploaded photos need preprocessing before storage:
- Large photos (5-20MB from phones) waste bandwidth and storage
- Images need placeholder previews while loading (blurhash)
- Photo metadata (EXIF) contains useful data like capture date

## Pipeline Order

```
File Input → Validate → Compress → Generate Blurhash → Extract EXIF → Create PendingItem
```

## Rules

### 1. Validation (First)

```typescript
// Check type
if (!file.type.startsWith('image/')) return;

// Check size (before compression)
if (file.size > 20 * 1024 * 1024) {
  alert('File too large. Max 20MB.');
  return;
}
```

Accepted: JPG, PNG, GIF, WebP, HEIC  
Rejected: PDF, DOC, TXT, ZIP, etc.

### 2. Compression

```typescript
import { compressImage, needsCompression } from '../utils/imageCompression';

if (needsCompression(file)) { // > 1MB
  const { dataUrl } = await compressImage(file);
  // Use dataUrl instead of original
}
```

Strategy:
- Resize to max 1920px on longest side
- JPEG quality 0.8
- Use `canvas.toDataURL('image/jpeg', 0.8)`
- Typically reduces 5MB → 200KB (95% reduction)

### 3. Blurhash Generation

```typescript
import { encodeImageToBlurhash } from '../utils/blurhash';

let blurhash = '';
try {
  blurhash = await encodeImageToBlurhash(imageDataUrl);
} catch {
  // Non-critical — continue without blurhash
}
```

- Use 4×3 component count for good quality/size balance
- Store as string in Firestore alongside image URL
- Render with `react-blurhash` component while image loads
- **Never let blurhash failure block the upload**

### 4. EXIF Date Extraction

```typescript
import exifr from 'exifr';

let photoDate: string | undefined;
try {
  const exif = await exifr.parse(file, ['DateTimeOriginal']);
  if (exif?.DateTimeOriginal instanceof Date) {
    photoDate = exif.DateTimeOriginal.toISOString();
  }
} catch {
  // No EXIF available — fallback to Date.now()
}
```

Fallback chain: `EXIF DateTimeOriginal` → `file.lastModified` → `Date.now()`

Cases without EXIF:
- PNG files
- Screenshots
- Photos forwarded via messaging apps (EXIF stripped)
- Images downloaded from web

### 5. Dependencies

```json
{
  "exifr": "^7.x",
  "blurhash": "^2.x",
  "react-blurhash": "^0.3.x"
}
```

### 6. Data Structure

```typescript
interface PendingItem {
  imageUrls: string[];      // data URLs (compressed)
  blurhashes: string[];     // blurhash strings, parallel to imageUrls
  photoDate?: string;       // ISO string from EXIF, undefined if unavailable
  // ... other fields
}
```

### 7. Testing Considerations
- E2E tests use `Buffer.from('fake')` as image data — blurhash will fail, EXIF will fail
- Both failures are caught silently and should not break the upload flow
- Unit tests should mock `exifr` and blurhash utilities
