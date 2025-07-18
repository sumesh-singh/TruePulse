import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Zap } from "lucide-react";

interface ModelDeploymentNodeProps {
  data: {
    label: string;
    status: 'active' | 'deploying' | 'stopped';
    version: string;
    requests: string;
  };
}

export const ModelDeploymentNode = memo(({ data }: ModelDeploymentNodeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'deploying': return 'bg-blue-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-48 shadow-lg border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Version:</span>
            <span>{data.version}</span>
          </div>
          <div className="flex justify-between">
            <span>Requests:</span>
            <span>{data.requests}</span>
          </div>
        </div>
        
        <div className="mt-2">
          <Badge variant={data.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {data.status}
          </Badge>
        </div>

        <Handle type="target" position={Position.Left} className="w-3 h-3" />
        <Handle type="source" position={Position.Right} className="w-3 h-3" />
      </CardContent>
    </Card>
  );
});