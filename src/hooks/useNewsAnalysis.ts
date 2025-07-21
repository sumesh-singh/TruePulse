import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  [key: string]: any;
}

export const useNewsAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyze = async (endpoint: string, body: object) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

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
    analyze('/analyze-text', { text });
  };

  const analyzeUrl = (url: string) => {
    analyze('/analyze-url', { url });
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeText,
    analyzeUrl,
    setError,
  };
};
