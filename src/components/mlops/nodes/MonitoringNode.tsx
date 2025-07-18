import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, AlertTriangle } from "lucide-react";

interface MonitoringNodeProps {
  data: {
    label: string;
    status: 'active' | 'warning' | 'error';
    alerts?: number;
    uptime?: string;
    lastCheck?: string;
  };
}

export const MonitoringNode = memo(({ data }: MonitoringNodeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-48 shadow-lg border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          {data.alerts !== undefined && (
            <div className="flex justify-between">
              <span>Alerts:</span>
              <span>{data.alerts}</span>
            </div>
          )}
          {data.uptime && (
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span>{data.uptime}</span>
            </div>
          )}
          {data.lastCheck && (
            <div className="flex justify-between">
              <span>Last check:</span>
              <span>{data.lastCheck}</span>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <Badge variant={data.status === 'warning' ? 'destructive' : 'default'} className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {data.status}
          </Badge>
        </div>

        <Handle type="target" position={Position.Left} className="w-3 h-3" />
      </CardContent>
    </Card>
  );
});