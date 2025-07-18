import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface ModelMetricsProps {
  selectedModel: string;
}

export function ModelMetrics({ selectedModel }: ModelMetricsProps) {
  const performanceData = [
    { time: '00:00', accuracy: 94.2, latency: 125, throughput: 850 },
    { time: '04:00', accuracy: 94.5, latency: 120, throughput: 920 },
    { time: '08:00', accuracy: 93.8, latency: 135, throughput: 780 },
    { time: '12:00', accuracy: 94.1, latency: 128, throughput: 890 },
    { time: '16:00', accuracy: 94.7, latency: 115, throughput: 950 },
    { time: '20:00', accuracy: 94.3, latency: 122, throughput: 870 },
  ];

  const predictionDistribution = [
    { label: 'Positive', count: 3420, percentage: 68.4 },
    { label: 'Negative', count: 1180, percentage: 23.6 },
    { label: 'Neutral', count: 400, percentage: 8.0 },
  ];

  const modelHealth = {
    accuracy: 94.3,
    precision: 92.1,
    recall: 89.7,
    f1Score: 90.9,
    averageLatency: 122,
    p99Latency: 245,
    throughput: 870,
    errorRate: 0.2,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Performance Metrics</h2>
          <p className="text-muted-foreground">Current model: {selectedModel}</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Healthy
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{modelHealth.accuracy}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              +0.5% from yesterday
            </div>
            <Progress value={modelHealth.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelHealth.averageLatency}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
              -8ms from yesterday
            </div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelHealth.throughput}</div>
            <div className="text-xs text-muted-foreground">requests/min</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{modelHealth.errorRate}%</div>
            <div className="text-xs text-muted-foreground">Very low</div>
            <Progress value={modelHealth.errorRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Over Time</CardTitle>
            <CardDescription>Model accuracy trending over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[93, 95]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latency & Throughput</CardTitle>
            <CardDescription>Response time and request volume metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Latency (ms)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Throughput (req/min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Details</CardTitle>
            <CardDescription>Detailed classification metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Precision</span>
              <span className="text-sm font-bold">{modelHealth.precision}%</span>
            </div>
            <Progress value={modelHealth.precision} />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Recall</span>
              <span className="text-sm font-bold">{modelHealth.recall}%</span>
            </div>
            <Progress value={modelHealth.recall} />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">F1-Score</span>
              <span className="text-sm font-bold">{modelHealth.f1Score}%</span>
            </div>
            <Progress value={modelHealth.f1Score} />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">P99 Latency</span>
              <span className="text-sm font-bold">{modelHealth.p99Latency}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Distribution</CardTitle>
            <CardDescription>Distribution of model predictions in the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={predictionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}