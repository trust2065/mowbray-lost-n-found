import React, { useCallback, useMemo } from 'react';
import { CATEGORIES } from '../constants';
import type { PendingItem, GeminiAnalysis } from '../types';
import { GeminiAnalysisSchema } from '../types';

export const useGeminiAPI = () => {
  const autoFillItem = useCallback(async (
    item: PendingItem,
    _index: number,
    setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>,
    abortControllers: React.MutableRefObject<Map<string, AbortController>>
  ): Promise<void> => {
    if (!item.imageUrls.length) return;

    if (abortControllers.current.has(item.id)) return;

    const controller = new AbortController();
    abortControllers.current.set(item.id, controller);

    setPendingItems(prev => prev.map(p =>
      p.id === item.id ? { ...p, isAnalyzing: true } : p
    ));

    const prompt = `Analyze this lost item for Mowbray Public School. Categorize as: ${CATEGORIES.join(', ')}. Return JSON: { "nameTag": "string", "category": "string", "description": "string" }`;

    try {
      const resp = await fetch(item.imageUrls[0]);
      const imageBlob = await resp.blob();

      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });

      if (controller.signal.aborted) throw new Error('Aborted');

      const mimeType = imageData.substring(imageData.indexOf(":") + 1, imageData.indexOf(";"));

      const proxyResponse = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageData.split(',')[1],
          mimeType,
          prompt
        }),
        signal: controller.signal
      });

      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json();
        throw new Error(errorData.error || 'Proxy error');
      }

      const responseJson = await proxyResponse.json();
      let analysisText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;

      let analysis: GeminiAnalysis;
      if (analysisText) {
        analysisText = analysisText.replace(/```json\n/g, '').replace(/```json/g, '').replace(/```/g, '').trim();
        const rawAnalysis = JSON.parse(analysisText);
        const result = GeminiAnalysisSchema.safeParse(rawAnalysis);

        if (result.success) {
          analysis = result.data;
        } else {
          analysis = {
            nameTag: rawAnalysis.nameTag || 'Unknown',
            category: rawAnalysis.category || CATEGORIES[0],
            description: rawAnalysis.description || ''
          };
        }
      } else {
        throw new Error('No analysis found');
      }

      setPendingItems(prev => prev.map(p =>
        p.id === item.id
          ? {
            ...p,
            nameTag: analysis.nameTag,
            category: analysis.category,
            description: analysis.description,
            isAnalyzing: false
          }
          : p
      ));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const debugEl = document.getElementById('ai-debug-error');
      if (debugEl) debugEl.setAttribute('data-error', errorMessage);

      setPendingItems(prev => prev.map(p =>
        p.id === item.id ? { ...p, isAnalyzing: false } : p
      ));
    } finally {
      abortControllers.current.delete(item.id);
    }
  }, []);

  const cancelAiFill = useCallback((itemId: string, abortControllers: React.MutableRefObject<Map<string, AbortController>>): void => {
    abortControllers.current.get(itemId)?.abort();
    abortControllers.current.delete(itemId);
  }, []);

  const cleanup = useCallback((abortControllers: React.MutableRefObject<Map<string, AbortController>>): void => {
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current.clear();
  }, []);

  const generateEmbedding = useCallback(async (text: string, taskType: string = 'RETRIEVAL_DOCUMENT'): Promise<number[] | null> => {
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'embed', text, taskType })
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.embedding?.values || null;
    } catch {
      return null;
    }
  }, []);

  return useMemo(() => ({ autoFillItem, cancelAiFill, cleanup, generateEmbedding }), [autoFillItem, cancelAiFill, cleanup, generateEmbedding]);
};
