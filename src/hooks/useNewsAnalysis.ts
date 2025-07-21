import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Define the structure of the analysis result for clarity
interface AnalysisResult {
  verified_sources?: { title: string; url: string; source_name: string }[];
  related_articles?: SimilarArticle[];
  [key: string]: any;
}

// Define the structure for a related/similar article
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

      const data: AnalysisResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unexpected server error occurred.');
      }

      setAnalysisResult(data);
      
      // Fix: Accept both related_articles and similar_articles, but prefer related_articles
      if (data.related_articles && Array.isArray(data.related_articles)) {
        setSimilarArticles(data.related_articles);
      } else if (data.similar_articles && Array.isArray(data.similar_articles)) {
        setSimilarArticles(data.similar_articles);
      } else {
        setSimilarArticles([]);
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
    similarArticles, // Ensure this is returned for the UI
    error,
    analyzeText,
    analyzeUrl,
    setError,
  };
};
