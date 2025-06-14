import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, FileText, TrendingUp, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import TrueFocus from './TrueFocus';

interface SimilarArticle {
  title: string;
  url: string;
  source?: string;
  published_at?: string;
  description?: string;
}

interface AnalysisResult {
  sentiment: string;
  confidence: number;
  keyTopics: string[];
  summary: string;
  wordCount: number;
  trustScore?: number;
  trustStatus?: string;
  newsDomain?: string | null;
}

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a news article or snippet to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Sending analysis request to:', window.location.origin + '/analyze');
      console.log('Request payload:', { text: inputText.substring(0, 100) + '...' });
      
      // First request to analyze endpoint
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error(`Server returned ${contentType || 'unknown content type'}. Expected JSON. Response: ${responseText.substring(0, 200)}...`);
      }

      const data = await response.json();
      console.log('Analysis response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      // Set the analysis result with the correct data structure
      const result: AnalysisResult = {
        sentiment: data.sentiment || data.label || 'Unknown',
        confidence: data.confidence || Math.round((data.score || 0) * 100),
        keyTopics: data.keyTopics || ['General', 'News'],
        summary: data.summary || 'Analysis completed successfully.',
        wordCount: data.wordCount || inputText.split(' ').filter(word => word.length > 0).length,
        trustScore: data.trustScore,
        trustStatus: data.trustStatus,
        newsDomain: data.newsDomain,
      };
      
      setAnalysisResult(result);

      // Second request to similar articles endpoint
      try {
        console.log('Fetching similar articles...');
        const similarResponse = await fetch('/similar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: inputText
          }),
        });

        if (similarResponse.ok) {
          const similarContentType = similarResponse.headers.get('content-type');
          if (similarContentType && similarContentType.includes('application/json')) {
            const similarData = await similarResponse.json();
            setSimilarArticles(similarData.articles || []);
            console.log('Similar articles found:', similarData.articles?.length || 0);
          } else {
            console.error('Similar articles endpoint returned non-JSON response');
            setSimilarArticles([]);
          }
        } else {
          console.error('Similar articles request failed:', similarResponse.status);
          setSimilarArticles([]);
        }
      } catch (similarError) {
        console.error('Error fetching similar articles:', similarError);
        setSimilarArticles([]);
      }
      
      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${result.sentiment} (${result.confidence}% confidence)`,
      });
      
    } catch (error) {
      console.error('Error analyzing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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

  const handleSummarize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a news article or snippet to summarize.",
        variant: "destructive",
      });
      return;
    }
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
      const response = await fetch('/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Server returned ${contentType}. Response: ${responseText.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Summarization failed');
      setSummaryResult(data.summary || "Summary not available.");
      toast({
        title: "Summary Complete",
        description: "The article has been summarized.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSummaryResult(null);
      toast({
        title: "Summarization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">
                <TrueFocus 
sentence="News Analytics"
manualMode={false}
blurAmount={5}
borderColor="red"
animationDuration={2}
pauseBetweenAnimations={1}
/>
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI-powered sentiment analysis for news articles. Analyze tone, extract key topics, and discover similar content.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <Send className="h-6 w-6 text-blue-600 mr-2" />
                Article Input
              </CardTitle>
              <CardDescription className="text-gray-600">
                Paste the full text of a news article for sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste the full news article text here for analysis..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[300px] text-base leading-relaxed border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{inputText.length} characters</span>
                    <span>{inputText.split(' ').filter(word => word.length > 0).length} words</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={isAnalyzing || !inputText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Sentiment...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Analyze Sentiment
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSummarizing || !inputText.trim()}
                    className="w-full py-3 text-lg font-medium transition-all duration-200"
                    onClick={handleSummarize}
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Summarize Article
                      </>
                    )}
                  </Button>
                </div>
              </form>
              {summaryResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2 text-gray-700">Summary</h3>
                  <p className="text-gray-900 whitespace-pre-line">{summaryResult}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <FileText className="h-6 w-6 text-blue-600 mr-2" />
                Analytics Results
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sentiment analysis and key insights
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

                  {/* Trust Score / News Source */}
                  <div className="p-4 rounded-lg bg-yellow-50 border">
                    <h3 className="font-semibold text-gray-800 mb-3">Trust Score</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-yellow-800">
                        {typeof analysisResult.trustScore === "number" ? `${analysisResult.trustScore}/100` : "N/A"}
                      </span>
                      <Badge className={
                        analysisResult.trustStatus === "Trusted"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : analysisResult.trustStatus === "Untrusted"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }>
                        {analysisResult.trustStatus || "Unknown"}
                      </Badge>
                      {analysisResult.newsDomain &&
                        <span className="ml-2 text-xs font-mono text-gray-500">
                          {analysisResult.newsDomain}
                        </span>
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {analysisResult.trustStatus === "Trusted" && "News source is recognized as generally reliable."}
                      {analysisResult.trustStatus === "Untrusted" && "This source is flagged as suspicious or unreliable."}
                      {analysisResult.trustStatus === "Unknown" && "Cannot determine reliability of the source."}
                    </p>
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

                  {/* Summary */}
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <h3 className="font-semibold text-gray-800 mb-3">Analysis Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{analysisResult.summary}</p>
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

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.wordCount}</div>
                      <div className="text-sm text-gray-600">Words Analyzed</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                      <div className="text-2xl font-bold text-green-600">{analysisResult.confidence}%</div>
                      <div className="text-sm text-gray-600">Confidence Score</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
