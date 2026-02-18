# Mowbray Lost & Found Hub

A modern React application for managing lost and found items at Mowbray Public School.

## Features

- **Item Management**: Upload and catalog lost items with photos
- **AI-Powered Analysis**: Automatic item categorization using Google Gemini AI
- **Search & Filter**: Find items by name, description, location, or category
- **Admin Access**: Staff mode for full historical access
- **Responsive Design**: Works on desktop and mobile devices

## Test Commands

- `npm test`: Run unit tests (Vitest)
- `npm run test:e2e`: Run E2E tests (Playwright) against local Firebase Emulator (Headless mode)
- `npm run test:ui`: Open Vitest UI for unit tests

## Important: Firebase Emulators

This project uses Firebase Emulators for development and testing to prevent accidental changes to the production database.

**Setup:**
1. Install Firebase Tools: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize Emulators (if not done): `firebase init emulators` (Select Firestore & Storage)
4. Ensure you have Java 21+ installed (required for emulators).

**Running E2E Tests:**
The command `npm run test:e2e` will automatically:
1. Start the Firebase Emulators.
2. Run the Playwright tests in headless mode.
3. Shut down the emulators upon completion.

## Security Improvements

✅ **Server-Side API Proxy**: Gemini API key is now secured on the backend
✅ **Strong Authentication**: Admin passcode updated to secure value
✅ **Error Handling**: Robust JSON parsing with fallback values
✅ **Memory Management**: Proper cleanup of FileReaders and API requests
✅ **Type Safety**: Full TypeScript implementation

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup frontend:**
```bash
cd mowbray-lost-n-found
npm install
```

2. **Setup backend proxy server:**
```bash
cd server
npm install
```

3. **Configure environment variables:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values:
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_ADMIN_PASSCODE=your_admin_passcode_here
```

### Running the Application

1. **Start both servers (recommended):**
```bash
# In root directory - starts both proxy server and dev server
npm start
# Proxy server: http://localhost:3001
# Frontend: http://localhost:5173
```

2. **Start servers separately:**
```bash
# Terminal 1 - Backend proxy server
cd server && npm start

# Terminal 2 - Frontend development server  
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Architecture

### Frontend Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── constants/          # App constants and configuration
└── App.tsx            # Main application component
```

### Backend Structure
```
server/
├── proxy.js           # Express proxy server
├── package.json       # Server dependencies
└── .env              # Server environment variables
```

## Security Notes

- **API Key Protection**: Gemini API key is never exposed to the client
- **Authentication**: Strong admin passcode with secure defaults
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling prevents information leakage

## Blurhash Migration

To generate blurhashes for existing images (those uploaded before the feature was added):

1. **Configure CORS**:
   Ensure your Firebase Storage bucket allows cross-origin requests so the client can read the image data.
   
   Run this command in your terminal (using the included `cors.json`):
   ```bash
   gsutil cors set cors.json gs://<your-bucket-name>
   ```
   *Note: You can find your bucket name in your `.env` file under `VITE_FIREBASE_STORAGE_BUCKET`.*

2. **Run the Script**:
   - Open the application in your browser (e.g., `http://localhost:5173`).
   - Open the Developer Console (`F12` or `Cmd+Option+J`).
   - Run the following command:
     ```javascript
     await window.migrateBlurhashes()
     ```
   - Wait for the success alert.

## Future Improvements

- [ ] **Data Validation**: Integrate `Zod` for runtime schema validation to ensure database data strictly matches our `Category` and `Location` types.
- [ ] **CI/CD Integration**: Setup GitHub Actions to automatically run Playwright E2E and Vitest unit tests on every Pull Request.
- [ ] **Smart Search (RAG)**: Implement vector search (using embeddings) to allow natural language queries like "that blue jacket with the yellow zipper."

## License

MIT License - see LICENSE file for details
