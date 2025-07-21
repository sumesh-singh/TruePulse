import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  [key: string]: any;
}

interface SimilarArticle {
    title: string;
    url: string;
    source: { name: string };
}

export const useNewsAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const findSimilar = useCallback(async (text: string) => {
    try {
        const response = await fetch('/similar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        const data = await response.json();
        if (response.ok && data.articles) {
            setSimilarArticles(data.articles);
        }
    } catch (err) {
        // Non-critical error, so we just log it without showing a toast
        console.error("Failed to fetch similar articles:", err);
    }
  }, []);

  const analyze = async (endpoint: string, body: object, textForSimilarity: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSimilarArticles([]);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unexpected server error occurred.');
      }

      setAnalysisResult(data);
      // After successful analysis, find similar articles
      findSimilar(textForSimilarity);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to the backend.';
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeText = (text: string) => {
    analyze('/analyze-text', { text }, text);
  };

  const analyzeUrl = (url: string) => {
    // For URL analysis, the text for similarity search is the URL itself initially.
    // The backend will fetch the content for the main analysis.
    analyze('/analyze-url', { url }, url);
  };

  return {
    isAnalyzing,
    analysisResult,
    similarArticles,
    error,
    analyzeText,
    analyzeUrl,
    setError,
  };
};
