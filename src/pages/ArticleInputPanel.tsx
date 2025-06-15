
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, TrendingUp } from 'lucide-react';

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
  inputText, setInputText, onAnalyze, isAnalyzing
}) => {
  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm transition-colors">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl text-foreground">
          <Send className="h-6 w-6 text-blue-600 mr-2" />
          Article Input
        </CardTitle>
        <CardDescription className="text-muted-foreground">
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
              className="min-h-[300px] text-base leading-relaxed border-input focus:border-blue-500 focus:ring-blue-500 resize-none bg-background text-foreground transition-colors"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ArticleInputPanel;
