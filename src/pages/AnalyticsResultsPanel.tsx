
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Loader2, AlertCircle, Brain } from "lucide-react";
import { SimilarArticle, AnalysisResult } from "../hooks/useNewsAnalysis";

interface AnalyticsResultsPanelProps {
  analysisResult: AnalysisResult | null;
  similarArticles: SimilarArticle[];
  error: string | null;
  isAnalyzing: boolean;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toLowerCase()) {
    case "positive": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
    case "negative": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
    case "neutral": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
    default: return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
  }
};

const getTrustScoreColor = (score: number) => {
  if (score >= 70) return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
  return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
};

const getRealFakeColor = (classification: string) => {
  switch (classification.toLowerCase()) {
    case "real": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
    case "fake": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
    default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
  }
};

const PLACEHOLDER_REASONINGS = [
  "Summarization model not available.",
  "No reasoning provided",
  "",
  null,
  undefined,
];

const AnalyticsResultsPanel: React.FC<AnalyticsResultsPanelProps> = ({
  analysisResult, similarArticles, error, isAnalyzing
}) => {
  // DEBUG LOG to verify similarArticles being received and rendered
  React.useEffect(() => {
    console.log("[AnalyticsResultsPanel] similarArticles prop:", similarArticles);
    if (analysisResult) {
      console.log("[AnalyticsResultsPanel] AnalysisResult prop:", analysisResult);
    }
  }, [similarArticles, analysisResult]);

  // Helper to check if we have a genuine reasoning string
  const hasValidReasoning =
    analysisResult?.reasoning &&
    !PLACEHOLDER_REASONINGS.includes(analysisResult.reasoning.trim());

  // <NEW>: Get more detail about backend fallback
  // The backend (Python) sometimes returns .fallback_info in the analysis result.
  const fallbackInfo = typeof analysisResult === "object" && "fallbackInfo" in (analysisResult as any)
    ? (analysisResult as any).fallbackInfo
    : undefined;

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm transition-colors">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl text-foreground">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          Analytics Results
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sentiment analysis, authenticity check, and key insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <p className="text-lg text-red-700 mb-2">Analysis Error</p>
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-4 rounded-lg text-left">
              <p className="font-medium mb-2">Error Details:</p>
              <p className="break-words">{error}</p>
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-xs">
                <p className="font-medium">Troubleshooting:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Make sure the Flask backend is running on port 5000</li>
                  <li>Check if the backend responds at: <code>http://localhost:5000/health</code></li>
                  <li>Restart both frontend and backend servers</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {!analysisResult && !isAnalyzing && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-lg mb-2">Ready for Analysis</p>
            <p className="text-sm">Enter article text above to see sentiment analysis and insights</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-lg text-foreground mb-2">Analyzing sentiment...</p>
            <p className="text-sm text-muted-foreground">Processing your article with AI</p>
          </div>
        )}

        {analysisResult && !error && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Trust Score & Authenticity */}
            <div className="p-4 rounded-lg bg-accent border border-accent text-foreground transition-colors">
              <h3 className="font-semibold text-foreground mb-3">Authenticity Assessment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Classification:</span>
                  <Badge className={`px-3 py-1 text-sm font-medium ${getRealFakeColor(analysisResult.realOrFake || "Unknown")}`}>
                    {analysisResult.realOrFake || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trust Score:</span>
                  <Badge className={`px-3 py-1 text-sm font-medium ${getTrustScoreColor(analysisResult.trustScore || 50)}`}>
                    {analysisResult.trustScore || 50}/100
                  </Badge>
                </div>
              </div>
              {analysisResult.fakeConfidence && analysisResult.fakeConfidence > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Detection confidence: {analysisResult.fakeConfidence}%
                </div>
              )}
              {/* NEW: Show fallback/unknown explanation when classification is "Unknown" */}
              {analysisResult.realOrFake?.toLowerCase() === "unknown" && (
                <div className="mt-4 p-3 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100 text-sm">
                  <strong>Unable to determine authenticity.</strong>
                  <br />
                  The AI model could not classify this article as "Fake" or "Real."
                  <br />
                  {fallbackInfo && (
                    <div className="mt-2">
                      <span className="font-medium">Reason:</span>{" "}
                      {(fallbackInfo as string).replace(/\.$/, '')}.
                    </div>
                  )}
                  {!fallbackInfo && (
                    <span>
                      This usually happens if your backend could not load a news authenticity model, or the result is too uncertain.<br />
                      Please check your backend logs for model loading errors.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sentiment Analysis */}
            <div className="p-4 rounded-lg bg-accent border border-accent text-foreground transition-colors">
              <h3 className="font-semibold text-foreground mb-3">Sentiment Analysis</h3>
              <div className="flex items-center justify-between">
                <Badge className={`px-3 py-1 text-sm font-medium ${getSentimentColor(analysisResult.sentiment)}`}>
                  {analysisResult.sentiment}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {analysisResult.confidence}% confidence
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent border border-accent text-foreground transition-colors">
              <h3 className="font-semibold text-foreground mb-3">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.keyTopics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            {hasValidReasoning && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border border-purple-200 dark:border-purple-800 transition-colors">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Brain className="h-5 w-5 text-purple-600 mr-2" />
                  AI Reasoning Report
                </h3>
                <div className="text-sm text-muted-foreground bg-background/50 dark:bg-background/30 p-3 rounded border">
                  <p className="leading-relaxed">{analysisResult.reasoning}</p>
                </div>
              </div>
            )}
            {similarArticles.length > 0 && (
              <div className="p-4 rounded-lg bg-accent border border-accent text-foreground transition-colors">
                <h3 className="font-semibold text-foreground mb-3">Related Articles</h3>
                <div className="space-y-3">
                  {similarArticles.map((article, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-card rounded-lg border border-border hover:border-blue-300 transition-colors">
                      <ExternalLink className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {article.title}
                        </a>
                        {article.source && (
                          <p className="text-xs text-muted-foreground mt-1">{article.source}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-900 border border-blue-100 dark:border-blue-900">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{analysisResult.wordCount}</div>
                <div className="text-sm text-muted-foreground">Words Analyzed</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900 dark:to-green-900 border border-emerald-100 dark:border-emerald-900">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{analysisResult.trustScore || 50}</div>
                <div className="text-sm text-muted-foreground">Trust Score</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsResultsPanel;
