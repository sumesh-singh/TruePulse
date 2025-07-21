
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface AnalysisResult {
  sentiment?: string;
  confidence?: number;
  real_or_fake?: string;
  fake_confidence?: number;
  trust_score?: number;
  keyTopics?: string[];
  reasoning?: string;
  verification_summary?: string;
  verified_sources?: { title: string; url: string; source_name: string }[];
  [key: string]: any;
}

interface SimilarArticle {
    title: string;
    url: string;
    source: { name: string };
}

interface AnalyticsResultsPanelProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  similarArticles: SimilarArticle[];
}

const renderSkeletons = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-6 w-1/2" />
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-20 w-full" />
  </div>
);

export const AnalyticsResultsPanel = ({ result, isLoading, similarArticles }: AnalyticsResultsPanelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis in Progress</CardTitle>
          <CardDescription>Evaluating article...</CardDescription>
        </CardHeader>
        <CardContent>{renderSkeletons()}</CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center">
          <h2 className="text-lg font-semibold">Ready for Analysis</h2>
          <p className="text-muted-foreground">
            Enter an article URL or paste text to see sentiment and authenticity insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const trustColor = result.trust_score > 70 ? 'bg-green-500' : result.trust_score > 40 ? 'bg-yellow-500' : 'bg-red-500';
  const authenticityVariant = result.real_or_fake === 'Real' ? 'secondary' : result.real_or_fake === 'Fake' ? 'destructive' : 'outline';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Results</CardTitle>
          <CardDescription>Sentiment, authenticity, and key insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Trust Score: {result.trust_score}%</h3>
            <Progress value={result.trust_score} className={`w-full h-2 ${trustColor}`} />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant={authenticityVariant}>Authenticity: {result.real_or_fake} ({result.fake_confidence}%)</Badge>
            <Badge variant="outline">Sentiment: {result.sentiment} ({result.confidence}%)</Badge>
          </div>

          <div>
            <h3 className="font-semibold">Key Topics</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.keyTopics?.map((topic, index) => <Badge key={index} variant="secondary">{topic}</Badge>)}
            </div>
          </div>
          
          <Alert>
            <AlertTitle>Analysis Reasoning</AlertTitle>
            <AlertDescription>{result.reasoning}</AlertDescription>
          </Alert>

          {result.verified_sources && result.verified_sources.length > 0 && (
            <div>
              <h3 className="font-semibold">Verified by Trusted Sources:</h3>
              <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                {result.verified_sources.map((source, index) => (
                  <li key={index}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {source.title} ({source.source_name}) <ExternalLink className="inline-block h-3 w-3 ml-1" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {similarArticles.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Related Articles</CardTitle>
                  <CardDescription>Other articles discussing similar topics.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-2 text-sm">
                      {similarArticles.map((article, index) => (
                          <li key={index}>
                              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                  {article.title} ({article.source.name}) <ExternalLink className="inline-block h-3 w-3 ml-1" />
                              </a>
                          </li>
                      ))}
                  </ul>
              </CardContent>
          </Card>
      )}
    </div>
  );
};
