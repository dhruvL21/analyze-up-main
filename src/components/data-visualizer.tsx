
'use client';

import { useMemo } from 'react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, ChartBar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/context/data-context';
import { getMonthlySalesData, getStockByCategoryData, getInventoryValueData } from '@/lib/chart-utils';

type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'radar'
  | 'radialBar';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

const chartComponents = {
  bar: BarChart,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  radar: RadarChart,
  radialBar: RadialBarChart,
};

export function DataVisualizer() {
  const { transactions, products, categories, isLoading } = useData();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metric, setMetric] = useState<'sales' | 'expenses' | 'profit'>('sales');
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const data = useMemo(() => {
    if (isLoading) return [];
    
    // Time-series charts use monthly sales
    if (['bar', 'line', 'area'].includes(chartType)) {
      return getMonthlySalesData(transactions, products);
    }
    if (metric === 'sales' && chartType === 'pie') {
        return getStockByCategoryData(products, categories);
    }
    if (metric === 'sales' && (chartType === 'radar' || chartType === 'radialBar')) {
        return getInventoryValueData(products, categories);
    }
    return getMonthlySalesData(transactions, products);
  }, [transactions, products, categories, metric, chartType, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            entry.target.classList.remove("revealed");
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    const items = document.querySelectorAll(".scroll-reveal-item");
    items.forEach(el => observer.observe(el));

    return () => items.forEach(el => observer.unobserve(el));
  }, [data]); // Re-observe when data changes

  const handleDownload = useCallback(async () => {
    if (!chartRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: null, // Use parent background
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${chartType}-chart.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [chartType]);
  
  const renderChart = () => {
    const ChartComponent = chartComponents[chartType];
    const commonProps = {
        data: data,
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const item = payload[0].payload;
        const isCategorical = ['pie', 'radar', 'radialBar'].includes(chartType);
        
        return (
          <div className="rounded-lg border bg-popover/70 p-2 shadow-sm backdrop-blur-sm text-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  {isCategorical ? 'Category' : 'Month'}
                </span>
                <span className="font-bold text-foreground">
                  {label || item.name}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  {isCategorical ? 'Stock' : (metric === 'sales' ? 'Revenue' : metric.charAt(0).toUpperCase() + metric.slice(1))}
                </span>
                <span className="font-bold text-foreground">
                  {isCategorical ? payload[0].value.toLocaleString() : `₹${payload[0].value.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          </div>
        );
      }
    
      return null;
    };
    
    const commonChildren = [
      <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />,
      <XAxis key="xaxis" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />,
      <YAxis key="yaxis" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => chartType === 'pie' || chartType === 'radialBar' || chartType === 'radar' ? value.toString() : `₹${value}`} />,
      <Tooltip key="tooltip" content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.5 }} />,
      <Legend key="legend" />,
    ];

    if (data.length === 0 || (['bar', 'line', 'area'].includes(chartType) && data.every(i => (i as any)[metric] === 0))) {
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <ChartBar className='h-12 w-12 text-muted-foreground/20 mx-auto' />
              <p className="text-sm text-muted-foreground">Add products and transactions to see visualization.</p>
            </div>
          </div>
        );
    }
    
    switch (chartType) {
        case 'pie':
        return (
            <PieChart>
                <Pie data={data} dataKey={metric} nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
            </PieChart>
        );

        case 'radar':
            return (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar name={metric} dataKey={metric} stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </RadarChart>
            )
        
        case 'radialBar':
            return (
                <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="10%" 
                    outerRadius="80%" 
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <RadialBar
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        dataKey={metric}
                    >
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </RadialBar>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} layout='vertical' verticalAlign='middle' align="right" />
                </RadialBarChart>
            );

        case 'line':
             return (
                <LineChart {...commonProps}>
                    {commonChildren}
                    <Line type="monotone" dataKey={metric} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            );
        case 'area':
             return (
                <AreaChart {...commonProps}>
                    {commonChildren}
                    <Area type="monotone" dataKey={metric} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
            );

        default: // bar
            return (
                <BarChart {...commonProps}>
                    {commonChildren}
                    <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            )
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold md:text-2xl">Data Visualizer</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select
            value={metric}
            onValueChange={(v) => setMetric(v as any)}
          >
            <SelectTrigger className="w-full sm:w-[150px] border-primary/30 bg-primary/5">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Revenue</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="radar">Radar Chart</SelectItem>
              <SelectItem value="radialBar">Radial Bar Chart</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            <span className='whitespace-nowrap'>{isDownloading ? 'Downloading...' : 'Download as PDF'}</span>
          </Button>
        </div>
      </div>
      <Card className="scroll-reveal-item">
        <CardHeader>
          <CardTitle>Sales Data Visualization</CardTitle>
          <CardDescription>
            Use the dropdown to select different ways to visualize the monthly sales data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="h-[400px] w-full bg-background p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
