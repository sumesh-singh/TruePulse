import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArticleInputPanel } from './ArticleInputPanel';
import { AnalyticsResultsPanel } from './AnalyticsResultsPanel';
import { useNewsAnalysis } from '@/hooks/useNewsAnalysis';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BackendStatus } from '@/components/BackendStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export const Index = () => {
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'text'
  const { isAnalyzing, analysisResult, similarArticles, error, analyzeText, analyzeUrl, setError } = useNewsAnalysis();

  const handleAnalyze = () => {
    setError(null);
    if (activeTab === 'url') {
      if (!urlInput.trim()) {
        setError("URL cannot be empty.");
        return;
      }
      analyzeUrl(urlInput);
    } else {
      if (!textInput.trim()) {
        setError("Text cannot be empty.");
        return;
      }
      analyzeText(textInput);
    }
  };

  const isSubmitDisabled = isAnalyzing || (activeTab === 'url' ? !urlInput.trim() : !textInput.trim());

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            TruePulse
          </h1>
          <BackendStatus />
        </div>
        <ThemeSwitcher />
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <ArticleInputPanel
            urlInput={urlInput}
            textInput={textInput}
            onUrlChange={setUrlInput}
            onTextChange={setTextInput}
            isAnalyzing={isAnalyzing}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <Button onClick={handleAnalyze} disabled={isSubmitDisabled} className="w-full">
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AnalyticsResultsPanel result={analysisResult} isLoading={isAnalyzing} similarArticles={similarArticles} />
        </div>
      </main>
    </div>
  );
};
