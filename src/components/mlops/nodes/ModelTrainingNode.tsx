import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp } from "lucide-react";

interface ModelTrainingNodeProps {
  data: {
    label: string;
    status: 'active' | 'idle' | 'training';
    lastRun: string;
    accuracy: string;
  };
}

export const ModelTrainingNode = memo(({ data }: ModelTrainingNodeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-48 shadow-lg border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Last run:</span>
            <span>{data.lastRun}</span>
          </div>
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span>{data.accuracy}</span>
          </div>
        </div>
        
        <div className="mt-2">
          <Badge variant={data.status === 'training' ? 'default' : 'secondary'} className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            {data.status}
          </Badge>
        </div>

        <Handle type="target" position={Position.Left} className="w-3 h-3" />
        <Handle type="source" position={Position.Right} className="w-3 h-3" />
      </CardContent>
    </Card>
  );
});