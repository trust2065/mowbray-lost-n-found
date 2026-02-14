import { CATEGORIES } from '../constants';
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
      const imageData = item.imageUrls[0].split(',')[1]; // Remove data URL prefix

      const response = await fetch('http://localhost:3001/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          prompt
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Safe JSON parsing with fallback values
      let analysis: GeminiAnalysis;
      try {
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
          throw new Error('No text content in AI response');
        }
        analysis = JSON.parse(textContent);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        // Use fallback values
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
