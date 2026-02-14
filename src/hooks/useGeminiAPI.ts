import { API_KEY, MODEL_NAME, CATEGORIES } from '../constants';
import type { PendingItem, GeminiAnalysis } from '../types';

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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/png", data: item.imageUrls[0].split(',')[1] } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          }),
          signal: controller.signal
        }
      );

      const result = await response.json();
      const analysis: GeminiAnalysis = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);

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
      if ((err as Error).name !== 'AbortError') console.error("AI Error:", err);
      setPendingItems(prev => {
        const next = [...prev];
        if (next[index]) next[index].isAnalyzing = false;
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
