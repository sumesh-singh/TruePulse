import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, FileText, TrendingUp } from 'lucide-react';
import { useNewsAnalysis } from "../hooks/useNewsAnalysis";

interface ArticleInputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onAnalyze: () => void;
  onSummarize: () => void;
  isAnalyzing: boolean;
  isSummarizing: boolean;
  summaryResult: string | null;
}

const ArticleInputPanel: React.FC<ArticleInputPanelProps> = ({
  inputText, setInputText, onAnalyze, onSummarize, isAnalyzing, isSummarizing, summaryResult
}) => {
  return (
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
        <form onSubmit={(e) => { e.preventDefault(); onAnalyze(); }} className="space-y-6">
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
              disabled={isSummarizing || !inputText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
              onClick={onSummarize}
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
  );
};

export default ArticleInputPanel;
