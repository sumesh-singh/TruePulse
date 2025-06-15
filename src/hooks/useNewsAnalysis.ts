
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
}

export function useNewsAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  const analyzeText = async (inputText: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSummaryResult(null);

    try {
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

      setAnalysisResult({
        sentiment: data.sentiment || data.label || "Unknown",
        confidence: data.confidence || Math.round((data.score || 0) * 100),
        keyTopics: data.keyTopics || ["General", "News"],
        wordCount: data.wordCount || inputText.split(' ').filter(word => word.length > 0).length,
        realOrFake: data.real_or_fake || "Unknown",
        fakeConfidence: data.fake_confidence || 0,
        trustScore: data.trust_score || 50,
      });

      fetchSimilarArticles(inputText);
      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${data.sentiment || data.label || "Unknown"}, Authenticity: ${data.real_or_fake || "Unknown"}`,
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error occurred";
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
      const response = await fetch('/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setSimilarArticles(data.articles || []);
        } else {
          setSimilarArticles([]);
        }
      } else {
        setSimilarArticles([]);
      }
    } catch {
      setSimilarArticles([]);
    }
  };

  const summarizeText = async (inputText: string) => {
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
      const response = await fetch('/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const contentType = response.headers.get('content-type');
      let responseText: string | null = null, data: any = null;

      if (!contentType || !contentType.includes('application/json')) {
        // Show the actual response text to the user
        responseText = await response.text();
        let errorMessage = "Server returned an unexpected response";
        if (responseText) {
          // Attempt to extract JSON error from HTML or display actual output, but also guard for "null"
          const match = responseText.match(/"error"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else if (
            responseText.trim().toLowerCase() === "null" ||
            responseText.trim() === ""
          ) {
            errorMessage = "No summary or error was returned by the server (empty/null response).";
          } else {
            errorMessage = responseText.substring(0, 300) +
              (responseText.length > 300 ? "..." : "");
          }
        }
        console.error("Summarize API non-JSON response:", responseText);
        throw new Error(errorMessage);
      }

      // If here, response is stated as JSON -- but let's try/catch as JSON parsing could still fail
      try {
        data = await response.json();
      } catch (parseErr) {
        responseText = await response.text();
        let parseMsg =
          "An error occurred while parsing the server response. " +
          (responseText ? `Raw response: ${responseText}` : "");
        console.error("Summarize API JSON parse error:", parseErr, responseText);
        throw new Error(parseMsg);
      }

      if (!response.ok) {
        throw new Error(
          (data && data.error) ||
            `Summarization failed (HTTP ${response.status})`
        );
      }

      if (!data || typeof data.summary !== "string" || !data.summary.trim()) {
        console.error("Summarize API returned invalid/empty data:", data);
        throw new Error("The server did not return a summary. Please try again.");
      }

      setSummaryResult(data.summary || "Summary not available.");
      toast({
        title: "Summary Complete",
        description: "The article has been summarized.",
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error";
      setSummaryResult(null);
      console.error("Summarization Error:", errorMessage, err);
      toast({
        title: "Summarization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return {
    isAnalyzing, analysisResult, similarArticles, error,
    summaryResult, isSummarizing,
    analyzeText, summarizeText, setSimilarArticles,
    setError,
  };
}
