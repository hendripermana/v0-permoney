'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface SankeyNode {
  id: string;
  name: string;
  value: number;
  color: string;
  type: 'source' | 'intermediate' | 'sink';
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyChartProps {
  data: SankeyData;
  currency?: string;
  title?: string;
  description?: string;
  className?: string;
}

// Simple Sankey visualization using CSS and SVG
function SimpleSankeyChart({ data, currency = 'IDR' }: { data: SankeyData; currency?: string }) {
  const { nodes, links } = data;
  
  // Calculate positions and dimensions
  const width = 800;
  const height = 400;
  const nodeWidth = 20;
  // const nodePadding = 10;
  
  // Group nodes by type for positioning
  const sourceNodes = nodes.filter(n => n.type === 'source');
  const intermediateNodes = nodes.filter(n => n.type === 'intermediate');
  const sinkNodes = nodes.filter(n => n.type === 'sink');
  
  // Calculate total values for scaling
  const maxValue = Math.max(...nodes.map(n => n.value));
  
  // Position nodes
  const positionedNodes = useMemo(() => {
    const positioned: Array<SankeyNode & { x: number; y: number; height: number }> = [];
    
    // Position source nodes (left side)
    sourceNodes.forEach((node, index) => {
      const nodeHeight = (node.value / maxValue) * (height * 0.6);
      positioned.push({
        ...node,
        x: 50,
        y: 50 + index * (height / sourceNodes.length),
        height: Math.max(nodeHeight, 20)
      });
    });
    
    // Position intermediate nodes (middle)
    intermediateNodes.forEach((node, index) => {
      const nodeHeight = (node.value / maxValue) * (height * 0.6);
      positioned.push({
        ...node,
        x: width / 2 - nodeWidth / 2,
        y: 50 + index * (height / Math.max(intermediateNodes.length, 1)),
        height: Math.max(nodeHeight, 20)
      });
    });
    
    // Position sink nodes (right side)
    sinkNodes.forEach((node, index) => {
      const nodeHeight = (node.value / maxValue) * (height * 0.6);
      positioned.push({
        ...node,
        x: width - 70,
        y: 50 + index * (height / sinkNodes.length),
        height: Math.max(nodeHeight, 20)
      });
    });
    
    return positioned;
  }, [maxValue, height, width, sourceNodes, intermediateNodes, sinkNodes]);
  
  // Generate paths for links
  const linkPaths = useMemo(() => {
    return links.map(link => {
      const sourceNode = positionedNodes.find(n => n.id === link.source);
      const targetNode = positionedNodes.find(n => n.id === link.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const linkHeight = (link.value / maxValue) * 30;
      const sourceX = sourceNode.x + nodeWidth;
      const sourceY = sourceNode.y + sourceNode.height / 2;
      const targetX = targetNode.x;
      const targetY = targetNode.y + targetNode.height / 2;
      
      // Create curved path
      const midX = (sourceX + targetX) / 2;
      const path = `M ${sourceX} ${sourceY - linkHeight/2} 
                   C ${midX} ${sourceY - linkHeight/2}, ${midX} ${targetY - linkHeight/2}, ${targetX} ${targetY - linkHeight/2}
                   L ${targetX} ${targetY + linkHeight/2}
                   C ${midX} ${targetY + linkHeight/2}, ${midX} ${sourceY + linkHeight/2}, ${sourceX} ${sourceY + linkHeight/2}
                   Z`;
      
      return {
        path,
        color: link.color,
        value: link.value
      };
    }).filter(Boolean);
  }, [links, positionedNodes, maxValue, nodeWidth]);
  
  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-[800px]">
        {/* Render links first (behind nodes) */}
        {linkPaths.map((link, index) => 
          link ? (
            <path
              key={index}
              d={link.path}
              fill={link.color}
              opacity={0.6}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ) : null
        )}
        
        {/* Render nodes */}
        {positionedNodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={nodeWidth}
              height={node.height}
              fill={node.color}
              rx={4}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            <text
              x={node.type === 'sink' ? node.x - 5 : node.x + nodeWidth + 5}
              y={node.y + node.height / 2}
              textAnchor={node.type === 'sink' ? 'end' : 'start'}
              dominantBaseline="middle"
              className="text-xs fill-current text-foreground font-medium"
            >
              {node.name}
            </text>
            <text
              x={node.type === 'sink' ? node.x - 5 : node.x + nodeWidth + 5}
              y={node.y + node.height / 2 + 12}
              textAnchor={node.type === 'sink' ? 'end' : 'start'}
              dominantBaseline="middle"
              className="text-xs fill-current text-muted-foreground"
            >
              {formatCurrency(node.value, currency)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SankeyChart({ 
  data, 
  currency = 'IDR', 
  title = 'Cash Flow',
  description = 'Money flow visualization',
  className 
}: SankeyChartProps) {
  return (
    <Card className={`permoney-card-chunky ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleSankeyChart data={data} currency={currency} />
      </CardContent>
    </Card>
  );
}

// Helper function to create sample cashflow data
export function createCashflowData(
  income: { salary: number; freelance: number; investments: number },
  expenses: { housing: number; food: number; transport: number; entertainment: number; savings: number }
): SankeyData {
  const totalIncome = income.salary + income.freelance + income.investments;
  
  return {
    nodes: [
      // Income sources
      { id: 'salary', name: 'Salary', value: income.salary, color: 'hsl(142, 76%, 36%)', type: 'source' },
      { id: 'freelance', name: 'Freelance', value: income.freelance, color: 'hsl(142, 76%, 46%)', type: 'source' },
      { id: 'investments', name: 'Investments', value: income.investments, color: 'hsl(142, 76%, 56%)', type: 'source' },
      
      // Total income (intermediate)
      { id: 'total_income', name: 'Total Income', value: totalIncome, color: 'hsl(217, 91%, 60%)', type: 'intermediate' },
      
      // Expense categories
      { id: 'housing', name: 'Housing', value: expenses.housing, color: 'hsl(0, 84%, 60%)', type: 'sink' },
      { id: 'food', name: 'Food', value: expenses.food, color: 'hsl(25, 95%, 53%)', type: 'sink' },
      { id: 'transport', name: 'Transport', value: expenses.transport, color: 'hsl(48, 96%, 53%)', type: 'sink' },
      { id: 'entertainment', name: 'Entertainment', value: expenses.entertainment, color: 'hsl(271, 91%, 65%)', type: 'sink' },
      { id: 'savings', name: 'Savings', value: expenses.savings, color: 'hsl(142, 76%, 36%)', type: 'sink' },
    ],
    links: [
      // Income to total
      { source: 'salary', target: 'total_income', value: income.salary, color: 'hsl(142, 76%, 36%)' },
      { source: 'freelance', target: 'total_income', value: income.freelance, color: 'hsl(142, 76%, 46%)' },
      { source: 'investments', target: 'total_income', value: income.investments, color: 'hsl(142, 76%, 56%)' },
      
      // Total to expenses
      { source: 'total_income', target: 'housing', value: expenses.housing, color: 'hsl(0, 84%, 60%)' },
      { source: 'total_income', target: 'food', value: expenses.food, color: 'hsl(25, 95%, 53%)' },
      { source: 'total_income', target: 'transport', value: expenses.transport, color: 'hsl(48, 96%, 53%)' },
      { source: 'total_income', target: 'entertainment', value: expenses.entertainment, color: 'hsl(271, 91%, 65%)' },
      { source: 'total_income', target: 'savings', value: expenses.savings, color: 'hsl(142, 76%, 36%)' },
    ]
  };
}
