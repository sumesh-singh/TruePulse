
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, FileText, TrendingUp, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SimilarArticle {
  title: string;
  url: string;
}

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [similarArticles, setSimilarArticles] = useState<SimilarArticle[]>([]);
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
    
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match our expected format
      const result = {
        sentiment: data.label || 'Unknown',
        confidence: Math.round((data.score || 0) * 100),
        keyTopics: data.keyTopics || ['Technology', 'Business', 'Innovation'],
        summary: data.summary || 'Analysis completed successfully.',
        wordCount: inputText.split(' ').filter(word => word.length > 0).length,
      };
      
      setAnalysisResult(result);

      // Second request to similar articles endpoint
      try {
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
          const similarData = await similarResponse.json();
          setSimilarArticles(similarData.articles || []);
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
        description: "Your news article has been successfully analyzed.",
      });
    } catch (error) {
      console.error('Error analyzing text:', error);
      
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'Negative': return 'bg-red-100 text-red-800 border-red-200';
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
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">NewsAnalyzer</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI-powered news analysis tool. Get insights on sentiment, key topics, and trends from any news article or text snippet.
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
                Input Article
              </CardTitle>
              <CardDescription className="text-gray-600">
                Paste your news article or text snippet below for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your news article or text snippet here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[300px] text-base leading-relaxed border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{inputText.length} characters</span>
                    <span>{inputText.split(' ').filter(word => word.length > 0).length} words</span>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isAnalyzing || !inputText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Analyze Article
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-gray-800">
                <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                Analysis Results
              </CardTitle>
              <CardDescription className="text-gray-600">
                AI-powered insights and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysisResult && !isAnalyzing && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No analysis yet</p>
                  <p className="text-sm">Submit an article to see the analysis results here</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-lg text-gray-700 mb-2">Analyzing your article...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
              )}

              {analysisResult && (
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
                    <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{analysisResult.summary}</p>
                  </div>

                  {/* Similar Articles */}
                  {similarArticles.length > 0 && (
                    <div className="p-4 rounded-lg bg-gray-50 border">
                      <h3 className="font-semibold text-gray-800 mb-3">Similar Articles</h3>
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
                              <p className="text-xs text-gray-500 mt-1 truncate">{article.url}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
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
