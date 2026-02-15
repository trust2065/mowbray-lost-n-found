import React from 'react';
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

    // Cancel any existing request for this item
    const existingController = abortControllers.current.get(item.id);
    if (existingController) {
      console.log(`[AI Fill] Cancelling existing request for item ${item.id}`);
      existingController.abort();
    }

    const controller = new AbortController();
    console.log(`[AI Fill] Creating new AbortController for item ${item.id}, signal: ${controller.signal.aborted}`);
    abortControllers.current.set(item.id, controller); // Add immediately to map

    setPendingItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isAnalyzing: true };
      return next;
    });

    const prompt = `Analyze this lost item for Mowbray Public School. Categorize as: ${CATEGORIES.join(', ')}. Return JSON: { "nameTag": "string", "category": "string", "description": "string" }`;

    try {
      // Convert image URL to base64
      console.log(`[AI Fill] Starting image fetch for item ${item.id}, signal: ${controller.signal.aborted}`);
      const response = await fetch(item.imageUrls[0]);
      const imageBlob = await response.blob();
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });

      // Use proxy server with rate limiting
      console.log(`[AI Fill] Starting proxy request for item ${item.id}, signal: ${controller.signal.aborted}`);

      // Check if signal was aborted during async operations
      if (controller.signal.aborted) {
        console.log(`[AI Fill] Request aborted before proxy call for item ${item.id}`);
        throw new Error('Request was aborted before proxy call');
      }

      const proxyResponse = await fetch('http://localhost:3001/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageData.split(',')[1], // Remove data:image/png;base64, prefix
          prompt
        }),
        signal: controller.signal
      });

      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json();
        console.error('Proxy server error details:', {
          status: proxyResponse.status,
          error: errorData.error,
          details: errorData.details || 'No additional details'
        });
        throw new Error(errorData.error || 'Proxy server error');
      }

      const responseText = await proxyResponse.text();

      // Safe JSON parsing with fallback values
      let analysis: GeminiAnalysis;
      try {
        const responseJson = JSON.parse(responseText);

        // Extract the actual analysis from Gemini's response structure
        const analysisText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;

        if (analysisText) {
          analysis = JSON.parse(analysisText);
          console.log('AI Analysis successful:', analysis);
        } else {
          throw new Error('No analysis text found in Gemini response');
        }
      } catch (parseError: unknown) {
        console.error('JSON parsing error:', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          responseText: responseText.substring(0, 200) + '...' // Truncate long responses
        });
        analysis = {
          nameTag: 'Unknown',
          category: CATEGORIES[0],
          description: 'Unable to analyze image - JSON parsing failed'
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
    } catch (error: unknown) {
      console.error("AI Fill Error:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        itemId: item.id,
        imageUrl: item.imageUrls[0],
        timestamp: new Date().toISOString()
      });

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
    console.log(`[AI Fill] Manual cancel requested for item ${itemId}`);
    abortControllers.current.get(itemId)?.abort();
    abortControllers.current.delete(itemId);
  };

  // Cleanup function for component unmount
  const cleanup = (abortControllers: React.MutableRefObject<Map<string, AbortController>>): void => {
    const activeCount = abortControllers.current.size;
    console.log(`[AI Fill] Cleanup called, aborting ${activeCount} requests`);

    // Only cleanup if there are actually requests to cleanup
    if (activeCount === 0) {
      console.log(`[AI Fill] Cleanup: No active requests to abort`);
      return;
    }

    try {
      abortControllers.current?.forEach((controller: AbortController, itemId: string) => {
        console.log(`[AI Fill] Cleanup: aborting request for item ${itemId}`);
        controller.abort();
      });
      abortControllers.current?.clear();
    } catch (error: unknown) {
      console.warn('Cleanup error:', error instanceof Error ? error.message : String(error));
    }
  };

  return { autoFillItem, cancelAiFill, cleanup };
};
