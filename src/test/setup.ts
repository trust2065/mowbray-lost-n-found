import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked AI response'
        }
      })
    })
  }))
}));

// Mock File and FileReader
global.File = vi.fn().mockImplementation((chunks, name, options) => ({
  name,
  type: options?.type || 'application/octet-stream',
  size: chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  lastModified: Date.now(),
  arrayBuffer: vi.fn(),
  slice: vi.fn(),
  stream: vi.fn(),
  text: vi.fn(),
})) as any;

global.FileReader = vi.fn().mockImplementation(() => {
  const reader = {
    result: null,
    readyState: 0,
    onload: null,
    onerror: null,
    readAsDataURL: vi.fn().mockImplementation(function (file) {
      setTimeout(() => {
        this.result = `data:${file.type};base64,mockdata`;
        this.readyState = 2;
        if (this.onload) this.onload({ target: this });
      }, 0);
    })
  };
  return reader;
}) as any;
