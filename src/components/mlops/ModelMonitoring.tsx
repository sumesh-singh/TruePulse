import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, XCircle, Clock, Bell, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ModelMonitoringProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

export function ModelMonitoring({ selectedModel, onModelSelect }: ModelMonitoringProps) {
  const [alertsFilter, setAlertsFilter] = useState("all");

  const models = [
    "sentiment-classifier-v1.2",
    "text-summarizer-v2.1",
    "fake-news-detector-v1.0",
    "topic-classifier-v1.3",
  ];

  const driftData = [
    { time: '00:00', dataDrift: 0.02, modelDrift: 0.01 },
    { time: '04:00', dataDrift: 0.03, modelDrift: 0.02 },
    { time: '08:00', dataDrift: 0.08, modelDrift: 0.04 },
    { time: '12:00', dataDrift: 0.12, modelDrift: 0.07 },
    { time: '16:00', dataDrift: 0.15, modelDrift: 0.09 },
    { time: '20:00', dataDrift: 0.11, modelDrift: 0.06 },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      title: "Data Drift Detected",
      description: "Input data distribution has shifted beyond threshold",
      timestamp: "2 hours ago",
      model: "sentiment-classifier-v1.2",
      severity: "medium",
      status: "active"
    },
    {
      id: 2,
      type: "error",
      title: "High Error Rate",
      description: "Error rate exceeded 5% in the last hour",
      timestamp: "4 hours ago", 
      model: "fake-news-detector-v1.0",
      severity: "high",
      status: "resolved"
    },
    {
      id: 3,
      type: "info",
      title: "Model Retrained",
      description: "Model successfully retrained with new data",
      timestamp: "6 hours ago",
      model: "text-summarizer-v2.1", 
      severity: "low",
      status: "resolved"
    },
    {
      id: 4,
      type: "warning",
      title: "Latency Spike",
      description: "Average response time increased by 40%",
      timestamp: "8 hours ago",
      model: "topic-classifier-v1.3",
      severity: "medium",
      status: "investigating"
    },
  ];

  const getAlertIcon = (type: string, status: string) => {
    if (status === "resolved") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (type === "error") return <XCircle className="w-4 h-4 text-red-500" />;
    if (type === "warning") return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary", 
      low: "outline"
    } as const;
    return <Badge variant={variants[severity as keyof typeof variants]}>{severity}</Badge>;
  };

  const filteredAlerts = alertsFilter === "all" 
    ? alerts 
    : alerts.filter(alert => alert.status === alertsFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Monitoring</h2>
          <p className="text-muted-foreground">Real-time monitoring and alerting for your ML models</p>
        </div>
        <Select value={selectedModel} onValueChange={onModelSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Model Health Status</CardTitle>
          <CardDescription>Current health indicators for {selectedModel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Model Status</p>
                <p className="text-sm text-muted-foreground">Healthy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-sm text-muted-foreground">99.8%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">Data Drift</p>
                <p className="text-sm text-muted-foreground">Moderate</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">Predictions Today</p>
                <p className="text-sm text-muted-foreground">24,567</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drift Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Model Drift</CardTitle>
          <CardDescription>Monitor distribution shifts in your data and model performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={driftData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="dataDrift" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Data Drift"
                dot={{ fill: '#f97316' }}
              />
              <Line 
                type="monotone" 
                dataKey="modelDrift" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Model Drift"
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-sm">Data Drift</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm">Model Drift</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Recent alerts and system notifications</CardDescription>
          </div>
          <Select value={alertsFilter} onValueChange={setAlertsFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                {getAlertIcon(alert.type, alert.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(alert.severity)}
                      <Badge variant="outline">{alert.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">Model: {alert.model}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}