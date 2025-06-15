import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SimilarArticle {
  title: string;
  url: string;
  source?: string;
  published_at?: string;
  description?: string;
  trust_score?: number;   // Added: trust score (0-100)
  trust_status?: string;  // Added: trust label e.g. "Trusted"
}

export interface AnalysisResult {
  sentiment: string;
  confidence: number;
  keyTopics: string[];
  wordCount: number;
  realOrFake?: string;      // Added: real/fake classification
  fakeConfidence?: number;  // Added: confidence in fake detection
  trustScore?: number;      // Added: overall trust score
  reasoning?: string;       // Added: AI reasoning explanation
}

export function useNewsAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeText = async (inputText: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      console.log("[ANALYSIS] Starting analysis for text:", inputText.substring(0, 100) + "...");
      
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Server returned ${contentType || "unknown content type"}. Response: ${responseText.substring(0, 200)}...`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log("[ANALYSIS] Analysis response received:", data);

      setAnalysisResult({
        sentiment: data.sentiment || data.label || "Unknown",
        confidence: data.confidence || Math.round((data.score || 0) * 100),
        keyTopics: data.keyTopics || ["General", "News"],
        wordCount: data.wordCount || inputText.split(' ').filter(word => word.length > 0).length,
        realOrFake: data.real_or_fake || "Unknown",
        fakeConfidence: data.fake_confidence || 0,
        trustScore: data.trust_score || 50,
        reasoning: data.reasoning || data.summary || "No reasoning provided",
        ...(data.fallback_info !== undefined ? { fallbackInfo: data.fallback_info } : {}),
      });

      // Fetch similar articles after successful analysis
      console.log("[SIMILAR ARTICLES] Starting fetch for similar articles...");
      fetchSimilarArticles(inputText);
      
      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${data.sentiment || data.label || "Unknown"}, Authenticity: ${data.real_or_fake || "Unknown"}`,
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error occurred";
      console.error("[ANALYSIS] Error during analysis:", err);
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchSimilarArticles = async (inputText: string) => {
    try {
      console.log("[SIMILAR ARTICLES] Making request to /similar endpoint...");
      
      const response = await fetch('/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      console.log("[SIMILAR ARTICLES] Response status:", response.status);
      console.log("[SIMILAR ARTICLES] Response headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log("[SIMILAR ARTICLES] Content type:", contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log("[SIMILAR ARTICLES] Data fetched from /similar API:", data);
          
          if (data.articles && Array.isArray(data.articles)) {
            console.log("[SIMILAR ARTICLES] Setting similar articles:", data.articles.length, "articles found");
            setSimilarArticles(data.articles);
          } else {
            console.log("[SIMILAR ARTICLES] No articles array in response or articles is not an array");
            setSimilarArticles([]);
          }
        } else {
          console.log("[SIMILAR ARTICLES] Response is not JSON, setting empty array");
          setSimilarArticles([]);
        }
      } else {
        const errorText = await response.text();
        console.error("[SIMILAR ARTICLES] HTTP error:", response.status, errorText);
        setSimilarArticles([]);
      }
    } catch (err) {
      console.error("[SIMILAR ARTICLES] Network/fetch error:", err);
      setSimilarArticles([]);
    }
  };

  return {
    isAnalyzing, analysisResult, similarArticles, error,
    analyzeText, setSimilarArticles,
    setError,
  };
}
