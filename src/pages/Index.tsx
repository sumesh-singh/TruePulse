import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import TrueFocus from "./TrueFocus";
import { useNewsAnalysis } from "../hooks/useNewsAnalysis";
import ArticleInputPanel from "./ArticleInputPanel";
import AnalyticsResultsPanel from "./AnalyticsResultsPanel";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const Index = () => {
  const [inputText, setInputText] = useState('');
  const {
    isAnalyzing,
    analysisResult,
    similarArticles,
    error,
    summaryResult,
    isSummarizing,
    analyzeText,
    summarizeText,
    setError,
    setSimilarArticles,
  } = useNewsAnalysis();

  // When user submits for analysis
  const handleAnalyze = () => {
    if (!inputText.trim()) {
      setError("Please enter a news article or snippet to analyze.");
      return;
    }
    analyzeText(inputText);
  };

  // When user wants to summarize
  const handleSummarize = () => {
    if (!inputText.trim()) {
      setError("Please enter a news article or snippet to summarize.");
      return;
    }
    summarizeText(inputText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
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
            {/* Theme toggle on the right */}
            <div className="ml-4">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ArticleInputPanel
            inputText={inputText}
            setInputText={setInputText}
            onAnalyze={handleAnalyze}
            onSummarize={handleSummarize}
            isAnalyzing={isAnalyzing}
            isSummarizing={isSummarizing}
            summaryResult={summaryResult}
          />
          <AnalyticsResultsPanel
            analysisResult={analysisResult}
            similarArticles={similarArticles}
            error={error}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
