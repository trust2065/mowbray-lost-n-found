import { CATEGORIES } from '../constants';
import type { PendingItem, GeminiAnalysis } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const useGeminiAPI = () => {
  const autoFillItem = async (
    item: PendingItem,
    index: number,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    abortControllers: React.MutableRefObject<Map<string, AbortController>>
  ): Promise<void> => {
    if (!item.imageUrls.length) return;

    const controller = new AbortController();
    abortControllers.current.set(item.id, controller);

    setPendingItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isAnalyzing: true };
      return next;
    });

    const prompt = `Analyze this lost item for Mowbray Public School. Categorize as: ${CATEGORIES.join(', ')}. Return JSON: { "nameTag": "string", "category": "string", "description": "string" }`;

    try {
      // Get API key from environment
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

      // Convert image URL to base64
      const response = await fetch(item.imageUrls[0]);
      const imageBlob = await response.blob();
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });

      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: "image/png"
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = await result.response.text();

      // Safe JSON parsing with fallback values
      let analysis: GeminiAnalysis;
      try {
        analysis = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        analysis = {
          nameTag: 'Unknown',
          category: CATEGORIES[0],
          description: 'Unable to analyze image'
        };
      }

      setPendingItems(prev => {
        const next = [...prev];
        if (next[index]?.id === item.id) {
          next[index] = {
            ...next[index],
            nameTag: analysis.nameTag || 'Unknown',
            category: analysis.category || CATEGORIES[0],
            description: analysis.description || '',
            isAnalyzing: false
          };
        }
        return next;
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("AI Error:", err);
      }
      setPendingItems(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index],
            isAnalyzing: false,
            nameTag: next[index].nameTag || 'Unknown',
            category: next[index].category || CATEGORIES[0],
            description: next[index].description || 'Analysis failed'
          };
        }
        return next;
      });
    } finally {
      abortControllers.current.delete(item.id);
    }
  };

  const cancelAiFill = (itemId: string, abortControllers: React.MutableRefObject<Map<string, AbortController>>): void => {
    abortControllers.current.get(itemId)?.abort();
    abortControllers.current.delete(itemId);
  };

  return { autoFillItem, cancelAiFill };
};
