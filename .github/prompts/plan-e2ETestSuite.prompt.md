# Comprehensive E2E Test Suite Plan for Mowbray Lost & Found

## 1. `e2e/workflow-staff.spec.ts` (Admin Lifecycle)
**Goal:** Verify a staff member can fully manage the item lifecycle (Create, View, Delete).
**Pre-conditions:** Start with a clean state or mock initial state.

### Test Case: Full Admin Cycle
1.  **Login Flow:**
    *   Navigate to Home.
    *   Double-click header title "Mowbray Public".
    *   Enter correct Passcode (mocked or environment variable).
    *   Assert "Staff Mode Enabled" indicator is visible.
2.  **Creation Flow (AI-Assisted):**
    *   Click "+" FAB.
    *   Upload 1 valid image.
    *   Click "AI Fill" button (mock API response).
    *   Verify fields population.
    *   Click "Post Item".
    *   **Assert:** Toast success message appears.
    *   **Assert:** Modal closes.
3.  **Verification Flow:**
    *   Check "All Items" view is active.
    *   Find the newly created item card by text.
4.  **Cleanup Flow:**
    *   Click "Delete All" button (admin only).
    *   Handle browser confirmation dialog.
    *   **Assert:** Item list is empty / "No items found" state.

## 2. `e2e/workflow-public.spec.ts` (Public User Journey)
**Goal:** Verify a regular visitor can report items and view details without authentication.

### Test Case: Guest Report & View
1.  **Guest Upload:**
    *   Click "+" FAB.
    *   Upload 1 valid image.
    *   Fill `Name Tag`, `Category`, `Location` manually.
    *   Click "Confirm Upload".
    *   **Assert:** Success toast.
2.  **Public Verification:**
    *   Check "Recent Discoveries" view.
    *   Verify item appears.
3.  **Detailed View:**
    *   Click item image.
    *   **Assert:** `PhotoViewer` overlay opens.
    *   Verify image source matches upload.
    *   Click "Close" (X button).
    *   **Assert:** Overlay closes.

## 3. `e2e/validation.spec.ts` (Edge Cases & Limits)
**Goal:** Ensure robustness against invalid inputs.

### Test Case: Upload Limits
1.  **Guest Photo Limit:**
    *   Open Upload Modal as Guest.
    *   Attempt to upload 6 files.
    *   **Assert:** Warning alert (or UI feedback) that only 5 are allowed.
2.  **File Type Validation:**
    *   Attempt to upload a `.txt` or `.pdf` file.
    *   **Assert:** File is rejected / Error alert shown.

### Test Case: Form Validation
1.  **Required Fields:**
    *   Open Upload Modal.
    *   Leave "Name Tag" empty.
    *   **Assert:** "Confirm Upload" is disabled OR clicking it shows validation error on the input.
    *   Fills "Name Tag" -> Error clears.

## Notes & refined strategy
*   **API Mocking:** Continue mocking `api/gemini/analyze` to ensure stability and speed.
*   **State Management:** 
    *   Run against a dedicated emulator suite (ideal).
