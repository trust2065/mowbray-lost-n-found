import type { ImportMetaEnv } from '../types';

export const getEnvVar = (key: keyof ImportMetaEnv, fallback: string): string => {
  try {
    return import.meta.env[key] || fallback;
  } catch {
    return fallback;
  }
};

export const API_KEY: string = ''; // Removed - now handled by server proxy
export const MODEL_NAME: string = "gemini-2.5-flash-preview-09-2025";
export const ADMIN_PASSCODE: string = getEnvVar('VITE_ADMIN_PASSCODE', '9402');

export const CATEGORIES: readonly string[] = ["School Hat", "Water Bottle", "Lunch Box"] as const;
export const LOCATIONS: readonly string[] = [
  "Basketball Court",
  "After School Area",
  "Lunch Area",
  "Library Hall",
  "I'm not sure",
  "Other"
] as const;
