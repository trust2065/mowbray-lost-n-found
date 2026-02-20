import { z } from 'zod';
import { CATEGORIES, LOCATIONS } from '../constants';

// --- Basic Schemas ---

export const CategorySchema = z.enum(CATEGORIES);
export const LocationSchema = z.enum(LOCATIONS);

export type Category = z.infer<typeof CategorySchema>;
export type Location = z.infer<typeof LocationSchema>;

// --- Core Data Schemas ---

/**
 * 代表已存檔的遺失物驗證結構
 */
export const ItemSchema = z.object({
  id: z.string(),
  imageUrls: z.array(z.string()),
  blurhashes: z.array(z.string()).optional(),
  nameTag: z.string().min(1, "Name tag cannot be empty"),
  category: CategorySchema,
  description: z.string(),
  foundDate: z.string(),
  location: LocationSchema,
  isDeleted: z.boolean().optional(),
  embedding: z.array(z.number()).optional(),
});

export type Item = z.infer<typeof ItemSchema>;

/**
 * 代表上傳暫存區中的物品驗證結構
 */
export const PendingItemSchema = ItemSchema.omit({ foundDate: true }).extend({
  customLocation: z.string().optional(),
  isAnalyzing: z.boolean(),
  activePreviewIdx: z.number(),
  photoDate: z.string().optional(),
});

export type PendingItem = z.infer<typeof PendingItemSchema>;

/**
 * Gemini AI 回傳的 JSON 結構定義
 */
export const GeminiAnalysisSchema = z.object({
  nameTag: z.string(),
  category: CategorySchema,
  description: z.string(),
});

export type GeminiAnalysis = z.infer<typeof GeminiAnalysisSchema>;

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
