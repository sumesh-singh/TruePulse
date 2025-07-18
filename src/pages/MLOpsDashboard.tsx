import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineFlow } from "@/components/mlops/PipelineFlow";
import { ModelMetrics } from "@/components/mlops/ModelMetrics";
import { ModelMonitoring } from "@/components/mlops/ModelMonitoring";
import { AlertTriangle, Activity, TrendingUp, Zap } from "lucide-react";

export default function MLOpsDashboard() {
  const [selectedModel, setSelectedModel] = useState("sentiment-classifier-v1.2");

  const modelStats = {
    totalModels: 12,
    activeModels: 8,
    deployedPipelines: 5,
    alertsToday: 3
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold text-foreground">ML Operations Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your machine learning models and pipelines in real-time
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Models</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelStats.totalModels}</div>
              <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Models</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelStats.activeModels}</div>
              <p className="text-xs text-muted-foreground">Running smoothly</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployed Pipelines</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelStats.deployedPipelines}</div>
              <p className="text-xs text-muted-foreground">All operational</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelStats.alertsToday}</div>
              <p className="text-xs text-muted-foreground">2 resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline">Pipeline Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Model Monitoring</TabsTrigger>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ML Pipeline Visualization</CardTitle>
                <CardDescription>
                  Interactive view of your machine learning pipeline flow
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <PipelineFlow />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <ModelMonitoring selectedModel={selectedModel} onModelSelect={setSelectedModel} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <ModelMetrics selectedModel={selectedModel} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}