# Mowbray Lost & Found Hub

A modern React application for managing lost and found items at Mowbray Public School.

## Features

- **Item Management**: Upload and catalog lost items with photos
- **AI-Powered Analysis**: Automatic item categorization using Google Gemini AI
- **Search & Filter**: Find items by name, description, location, or category
- **Admin Access**: Staff mode for full historical access
- **Responsive Design**: Works on desktop and mobile devices

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

## Future Improvements

- [ ] Implement pagination for large datasets
- [ ] Add database persistence
- [ ] Implement user authentication system
- [ ] Add email notifications for found items
- [ ] Implement item archiving system

## License

MIT License - see LICENSE file for details
