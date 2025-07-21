
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ArticleInputPanelProps {
  urlInput: string;
  textInput: string;
  onUrlChange: (value: string) => void;
  onTextChange: (value: string) => void;
  isAnalyzing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ArticleInputPanel = ({
  urlInput,
  textInput,
  onUrlChange,
  onTextChange,
  isAnalyzing,
  activeTab,
  onTabChange,
}: ArticleInputPanelProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Article Input</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" disabled={isAnalyzing}>Analyze by URL</TabsTrigger>
            <TabsTrigger value="text" disabled={isAnalyzing}>Analyze by Text</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <div className="space-y-2 mt-4">
              <label htmlFor="url-input" className="text-sm font-medium">News Article URL</label>
              <Input
                id="url-input"
                placeholder="https://www.example.com/news/article"
                value={urlInput}
                onChange={(e) => onUrlChange(e.target.value)}
                disabled={isAnalyzing}
              />
               <p className="text-xs text-muted-foreground">
                Enter the full URL of the news article you want to analyze.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="text">
            <div className="space-y-2 mt-4">
               <label htmlFor="text-input" className="text-sm font-medium">Paste Article Text</label>
              <Textarea
                id="text-input"
                placeholder="Paste the full text of a news article here for analysis..."
                value={textInput}
                onChange={(e) => onTextChange(e.target.value)}
                className="min-h-[200px]"
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                The more text you provide, the more accurate the analysis will be.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
