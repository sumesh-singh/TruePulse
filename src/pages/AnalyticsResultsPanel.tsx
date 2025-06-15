import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { SimilarArticle, AnalysisResult } from "../hooks/useNewsAnalysis";

interface AnalyticsResultsPanelProps {
  analysisResult: AnalysisResult | null;
  similarArticles: SimilarArticle[];
  error: string | null;
  isAnalyzing: boolean;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toLowerCase()) {
    case "positive": return "bg-green-100 text-green-800 border-green-200";
    case "negative": return "bg-red-100 text-red-800 border-red-200";
    case "neutral": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default: return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const getTrustScoreColor = (score: number) => {
  if (score >= 70) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
};

const getRealFakeColor = (classification: string) => {
  switch (classification.toLowerCase()) {
    case "real": return "bg-green-100 text-green-800 border-green-200";
    case "fake": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const AnalyticsResultsPanel: React.FC<AnalyticsResultsPanelProps> = ({
  analysisResult, similarArticles, error, isAnalyzing
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl text-gray-800">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          Analytics Results
        </CardTitle>
        <CardDescription className="text-gray-600">
          Sentiment analysis, authenticity check, and key insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <p className="text-lg text-red-700 mb-2">Analysis Error</p>
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg text-left">
              <p className="font-medium mb-2">Error Details:</p>
              <p className="break-words">{error}</p>
              <div className="mt-3 p-2 bg-red-100 rounded text-xs">
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
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">Ready for Analysis</p>
            <p className="text-sm">Enter article text above to see sentiment analysis and insights</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-lg text-gray-700 mb-2">Analyzing sentiment...</p>
            <p className="text-sm text-gray-500">Processing your article with AI</p>
          </div>
        )}

        {analysisResult && !error && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Trust Score & Authenticity */}
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h3 className="font-semibold text-gray-800 mb-3">Authenticity Assessment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classification:</span>
                  <Badge className={`px-3 py-1 text-sm font-medium ${getRealFakeColor(analysisResult.realOrFake || "Unknown")}`}>
                    {analysisResult.realOrFake || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trust Score:</span>
                  <Badge className={`px-3 py-1 text-sm font-medium ${getTrustScoreColor(analysisResult.trustScore || 50)}`}>
                    {analysisResult.trustScore || 50}/100
                  </Badge>
                </div>
              </div>
              {analysisResult.fakeConfidence && analysisResult.fakeConfidence > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Detection confidence: {analysisResult.fakeConfidence}%
                </div>
              )}
            </div>

            {/* Sentiment Analysis */}
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h3 className="font-semibold text-gray-800 mb-3">Sentiment Analysis</h3>
              <div className="flex items-center justify-between">
                <Badge className={`px-3 py-1 text-sm font-medium ${getSentimentColor(analysisResult.sentiment)}`}>
                  {analysisResult.sentiment}
                </Badge>
                <span className="text-sm text-gray-600">
                  {analysisResult.confidence}% confidence
                </span>
              </div>
            </div>

            {/* Key Topics */}
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h3 className="font-semibold text-gray-800 mb-3">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.keyTopics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Similar Articles */}
            {similarArticles.length > 0 && (
              <div className="p-4 rounded-lg bg-gray-50 border">
                <h3 className="font-semibold text-gray-800 mb-3">Related Articles</h3>
                <div className="space-y-3">
                  {similarArticles.map((article, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <ExternalLink className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {article.title}
                        </a>
                        {article.source && (
                          <p className="text-xs text-gray-500 mt-1">{article.source}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updated Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.wordCount}</div>
                <div className="text-sm text-gray-600">Words Analyzed</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{analysisResult.trustScore || 50}</div>
                <div className="text-sm text-gray-600">Trust Score</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsResultsPanel;
