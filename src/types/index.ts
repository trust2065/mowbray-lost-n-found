/**
 * 代表已存檔的遺失物資料結構
 */
export interface Item {
  id: string;
  imageUrls: string[];
  blurhashes?: string[];
  nameTag: string;
  category: string;
  description: string;
  foundDate: string;
  location: string;
}

/**
 * 代表上傳暫存區中的物品，繼承 Item 但移除日期並加入 UI 狀態
 */
export interface PendingItem extends Omit<Item, 'foundDate'> {
  customLocation?: string;
  isAnalyzing: boolean;
  activePreviewIdx: number;
}

/**
 * Gemini AI 回傳的 JSON 結構定義
 */
export interface GeminiAnalysis {
  nameTag: string;
  category: string;
  description: string;
}

/**
 * 擴充 Vite 的環境變數型別定義
 */
export interface ImportMetaEnv {
  readonly VITE_ADMIN_PASSCODE: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

export type ViewMode = 'grid' | 'list';
