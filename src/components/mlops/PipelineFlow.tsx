import { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DataIngestionNode } from './nodes/DataIngestionNode';
import { ModelTrainingNode } from './nodes/ModelTrainingNode';
import { ModelDeploymentNode } from './nodes/ModelDeploymentNode';
import { MonitoringNode } from './nodes/MonitoringNode';

const nodeTypes = {
  dataIngestion: DataIngestionNode,
  modelTraining: ModelTrainingNode,
  modelDeployment: ModelDeploymentNode,
  monitoring: MonitoringNode,
};

const initialNodes = [
  {
    id: 'data-1',
    type: 'dataIngestion',
    position: { x: 50, y: 100 },
    data: {
      label: 'Data Ingestion',
      status: 'active',
      lastRun: '2 min ago',
      throughput: '1.2K records/sec'
    },
  },
  {
    id: 'training-1',
    type: 'modelTraining',
    position: { x: 300, y: 100 },
    data: {
      label: 'Model Training',
      status: 'idle',
      lastRun: '6 hours ago',
      accuracy: '94.2%'
    },
  },
  {
    id: 'deployment-1',
    type: 'modelDeployment',
    position: { x: 550, y: 100 },
    data: {
      label: 'Model Deployment',
      status: 'active',
      version: 'v1.2.3',
      requests: '450/min'
    },
  },
  {
    id: 'monitoring-1',
    type: 'monitoring',
    position: { x: 800, y: 100 },
    data: {
      label: 'Model Monitoring',
      status: 'active',
      alerts: 0,
      uptime: '99.8%'
    },
  },
  {
    id: 'data-2',
    type: 'dataIngestion',
    position: { x: 50, y: 300 },
    data: {
      label: 'Validation Data',
      status: 'active',
      lastRun: '5 min ago',
      throughput: '300 records/sec'
    },
  },
  {
    id: 'monitoring-2',
    type: 'monitoring',
    position: { x: 800, y: 300 },
    data: {
      label: 'Data Quality Monitor',
      status: 'warning',
      alerts: 1,
      lastCheck: '1 min ago'
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: 'data-1',
    target: 'training-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
  },
  {
    id: 'e2-3',
    source: 'training-1',
    target: 'deployment-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e3-4',
    source: 'deployment-1',
    target: 'monitoring-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
  },
  {
    id: 'e5-4',
    source: 'data-2',
    target: 'monitoring-2',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
  },
  {
    id: 'e5-3',
    source: 'data-2',
    target: 'deployment-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeDasharray: '5,5' },
  },
];

export function PipelineFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      className="bg-background"
    >
      <Controls />
      <MiniMap className="bg-card" />
      <Background />
    </ReactFlow>
  );
}