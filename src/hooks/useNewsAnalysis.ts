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

  const analyze = useCallback(async (payload: { url?: string; text?: string }) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSimilarArticles([]);

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unexpected server error occurred.');
      }

      setAnalysisResult(data);
      // The backend response now includes everything, including similar/verified articles
      if (data.verified_sources) {
        setSimilarArticles(data.verified_sources);
      }

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
  }, [toast]);

  const analyzeText = (text: string) => {
    analyze({ text });
  };

  const analyzeUrl = (url: string) => {
    analyze({ url });
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
