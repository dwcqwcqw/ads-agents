"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Brain,
  Database,
  Target,
  MessageSquare,
  TrendingUp,
  Play,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  Sparkles,
  BookOpen,
  User,
  FileText,
  Eye,
  Clock,
  Layers,
  TrendingDown,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  Users,
  Target as TargetIcon,
  MessageCircle,
  Shield,
  BookMarked,
  Cpu,
  PenTool,
  Image as ImageIcon,
  Type,
  Layout,
  Hash,
  Zap,
  ArrowRight,
  ChevronDown,
  Cpu as ChipIcon,
  Network,
  Bot,
  Gauge,
  Layers as LayersIcon,
  ScatterChart as ScatterIcon,
  LineChart as LineIcon,
} from "lucide-react";

// 动态导入Hyperspeed和ColorBends组件以避免SSR问题
const Hyperspeed = dynamic(() => import("@/components/Hyperspeed"), { ssr: false });
const ColorBends = dynamic(() => import("@/components/ColorBends"), { ssr: false });
import ShinyText from "@/components/ShinyText";
import GradientCards from "@/components/ui/GradientCards";

// 智能体配置
const AGENTS = [
  { id: "profile", name: "画像分析智能体", avatar: "/icons/emma.webp", color: "#3b82f6", bgLight: "#eff6ff" },
  { id: "enrich", name: "数据补全智能体", avatar: "/icons/david.webp", color: "#8b5cf6", bgLight: "#f5f3ff" },
  { id: "match", name: "广告匹配智能体", avatar: "/icons/adrian.png", color: "#10b981", bgLight: "#ecfdf5" },
  { id: "creative", name: "创意生成智能体", avatar: "/icons/bob.webp", color: "#f97316", bgLight: "#fff7ed" },
  { id: "sales", name: "销售对话智能体", avatar: "/icons/alex.webp", color: "#ec4899", bgLight: "#fdf2f8" },
  { id: "optimization", name: "优化分析智能体", avatar: "/icons/iris.webp", color: "#06b6d4", bgLight: "#ecfeff" }
];

// Hyperspeed 动效配置 - 提取到组件外部避免每次渲染创建新对象
const HERO_HYPERSPEED_OPTIONS = {
  distortion: 'turbulentDistortion',
  length: 400,
  colors: {
    roadColor: 0x0a0a0f,
    islandColor: 0x0f0f15,
    background: 0x000000,
    shoulderLines: 0x3b82f6,
    brokenLines: 0x6366f1,
    leftCars: [0x8b5cf6, 0xa855f7, 0xc084fc],
    rightCars: [0x06b6d4, 0x22d3ee, 0x67e8f9],
    sticks: 0x3b82f6,
  }
};

interface WorkflowStep {
  id: string;
  agentId: string;
  type: "思考" | "工具" | "完成";
  label: string;
  toolName?: string;
  description?: string;
  isMainOutput?: boolean;
}

// 图表颜色
const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#ec4899", "#06b6d4", "#eab308", "#6366f1"];

// 散点图组件
const ScatterChart = ({ data, title, height = 200 }: { data: { x: number; y: number; size?: number; label?: string }[]; title?: string; height?: number }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
    {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          {CHART_COLORS.map((color, i) => (
            <radialGradient key={i} id={`scatter-grad-${i}`}>
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.2" />
            </radialGradient>
          ))}
        </defs>
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeOpacity="0.1" strokeWidth="0.3" />
        ))}
        {[0, 25, 50, 75, 100].map(x => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeOpacity="0.1" strokeWidth="0.3" />
        ))}
        {/* 数据点 */}
        {data.map((point, i) => {
          const cx = point.x;
          const cy = 100 - point.y;
          const r = point.size || 3;
          return (
            <motion.circle
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#scatter-grad-${i % CHART_COLORS.length})`}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth="0.5"
              style={{ filter: `drop-shadow(0 0 ${r}px ${CHART_COLORS[i % CHART_COLORS.length]}40)` }}
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 text-[9px] text-white/30">0</div>
      <div className="absolute bottom-0 right-0 text-[9px] text-white/30">100</div>
      <div className="absolute top-0 left-0 text-[9px] text-white/30">100</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-white/30">X</div>
      <div className="absolute top-1/2 -translate-y-1/2 right-0 text-[9px] text-white/30">Y</div>
    </div>
  </div>
);

// 饼图组件
const PieChart = ({ data, title, height = 200 }: { data: { label: string; value: number; color?: string }[]; title?: string; height?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;
  
  const getArcPath = (startAngle: number, endAngle: number, radius = 40) => {
    const start = { x: 50 + radius * Math.cos((startAngle * Math.PI) / 180), y: 50 + radius * Math.sin((startAngle * Math.PI) / 180) };
    const end = { x: 50 + radius * Math.cos((endAngle * Math.PI) / 180), y: 50 + radius * Math.sin((endAngle * Math.PI) / 180) };
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-1/2 aspect-square">
          <defs>
            {data.map((_, i) => (
              <filter key={i} id={`pie-glow-${i}`}>
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>
          {data.map((item, i) => {
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            const path = getArcPath(startAngle, endAngle);
            currentAngle = endAngle;
            return (
              <motion.path
                key={i}
                d={path}
                fill={item.color || CHART_COLORS[i % CHART_COLORS.length]}
                filter={`url(#pie-glow-${i})`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                style={{ transformOrigin: '50px 50px' }}
              />
            );
          })}
          <circle cx="50" cy="50" r="20" fill="#0a0a0f" />
        </svg>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-xs text-white/60 flex-1 truncate">{item.label}</span>
              <span className="text-xs font-medium text-white">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 折线图组件
const LineChart = ({ data, title, height = 200, showArea = true }: { data: { label: string; value: number; }[]; title?: string; height?: number; showArea?: boolean }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 100
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <filter id="line-glow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* 网格 */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeOpacity="0.08" strokeWidth="0.3" />
          ))}
          {/* 区域填充 */}
          {showArea && (
            <motion.path
              d={areaPath}
              fill="url(#line-gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          {/* 折线 */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#line-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {/* 数据点 */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#8b5cf6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ filter: 'drop-shadow(0 0 3px #8b5cf6)' }}
            />
          ))}
        </svg>
        {/* X轴标签 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-white/40">
          {data.map((d, i) => i % Math.ceil(data.length / 5) === 0 && <span key={i}>{d.label}</span>)}
        </div>
      </div>
    </div>
  );
};

// 柱状图组件
const BarChart = ({ data, title, height = 200 }: { data: { label: string; value: number; color?: string }[]; title?: string; height?: number }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 100 / data.length - 2;

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <div className="relative flex items-end justify-around gap-2" style={{ height }}>
        {data.map((d, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="w-full flex items-end justify-center" style={{ height: `${(d.value / maxValue) * 100}%` }}>
              <motion.div
                className="w-3/4 rounded-t-md"
                style={{ backgroundColor: d.color || '#8b5cf6', boxShadow: `0 0 10px ${d.color || '#8b5cf6'}40` }}
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-white/50 mt-1 truncate w-full text-center">{d.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 面积图组件
const AreaChart = ({ data, title, height = 200 }: { data: { label: string; value: number }[]; title?: string; height?: number }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 100
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* 网格 */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeOpacity="0.08" strokeWidth="0.3" />
          ))}
          {/* 区域填充 */}
          <motion.path
            d={areaPath}
            fill="url(#area-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          {/* 折线 */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* X轴标签 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-white/40">
          {data.map((d, i) => <span key={i}>{d.label}</span>)}
        </div>
      </div>
    </div>
  );
};

// 雷达图组件
const RadarChart = ({ data, title, height = 200 }: { data: { label: string; value: number; }[]; title?: string; height?: number }) => {
  const center = 50;
  const radius = 35;
  const angles = data.map((_, i) => (360 / data.length) * i - 90);
  const maxValue = 100;
  
  const getPoint = (value: number, angle: number) => {
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos((angle * Math.PI) / 180),
      y: center + r * Math.sin((angle * Math.PI) / 180)
    };
  };

  const dataPoints = data.map((d, i) => getPoint(d.value, angles[i]));
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* 网格 */}
        {[1, 2, 3, 4].map(level => (
          <polygon
            key={level}
            points={angles.map(a => {
              const p = getPoint((level / 4) * maxValue, a);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="0.2"
          />
        ))}
        {/* 轴线 */}
        {angles.map((a, i) => {
          const p = getPoint(maxValue, a);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="white" strokeOpacity="0.1" strokeWidth="0.2" />;
        })}
        {/* 数据区域 */}
        <motion.polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="url(#radar-fill)"
          stroke="#ec4899"
          strokeWidth="0.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {/* 数据点 */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="#ec4899"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
        {/* 标签 */}
        {data.map((d, i) => {
          const labelPoint = getPoint(maxValue + 8, angles[i]);
          return (
            <text
              key={i}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fillOpacity="0.6"
              fontSize="3"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// 漏斗图组件
const FunnelChart = ({ data, title }: { data: { label: string; value: number; rate?: number }[]; title?: string }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
    {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
    <div className="space-y-2">
      {data.map((item, i) => {
        const maxValue = data[0]?.value || 1;
        const widthPercent = (item.value / maxValue) * 100;
        return (
          <div key={i} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">{item.value.toLocaleString()}</span>
                {item.rate && <span className="text-xs text-white/40">({item.rate}%)</span>}
              </div>
            </div>
            <div className="h-8 bg-white/5 rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPercent}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full rounded"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// 环形进度图组件
const DonutChart = ({ data, title, height = 200 }: { data: { label: string; value: number; color?: string }[]; title?: string; height?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 100 100" className="w-full max-w-[180px]">
          <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="8" />
          {data.map((item, i) => {
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 50 + 38 * Math.cos(startRad);
            const y1 = 50 + 38 * Math.sin(startRad);
            const x2 = 50 + 38 * Math.cos(endRad);
            const y2 = 50 + 38 * Math.sin(endRad);
            const largeArc = angle > 180 ? 1 : 0;
            
            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={item.color || CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="8"
                strokeDasharray={`${(item.value / total) * 238.76} 238.76`}
                strokeLinecap="round"
                initial={{ rotate: -90 }}
                style={{ transformOrigin: '50px 50px' }}
              />
            );
          })}
          <text x="50" y="48" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
            {total}
          </text>
          <text x="50" y="56" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="4">
            总计
          </text>
        </svg>
        <div className="w-full grid grid-cols-2 gap-2 text-xs">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-white/60 truncate">{item.label}</span>
              <span className="font-medium text-white ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 进度条组件
const ProgressBars = ({ data, title, height = 160 }: { data: { label: string; value: number; color?: string }[]; title?: string; height?: number }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
    {title && <h4 className="text-sm font-medium text-white/80 mb-3">{title}</h4>}
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">{item.label}</span>
            <span className="font-medium text-white">{item.value}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MetricCard = ({ label, value, subValue, icon: Icon, color, trend }: { label: string; value: string; subValue?: string; icon: any; color: string; trend?: "up" | "down" }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-black/40 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-white/50 mb-1">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
      </div>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/30">
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-0.5 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        )}
      </div>
    </div>
  </div>
);

// 文字分析卡片
const TextCard = ({ title, content, icon: CardIcon, color }: { title: string; content: string; icon?: any; color?: string }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
    <div className="px-4 py-3 bg-black/30 border-b border-white/10 flex items-center gap-2">
      {CardIcon && <CardIcon className="h-4 w-4" style={{ color: color || "#3b82f6" }} />}
      <h4 className="text-sm font-medium text-white">{title}</h4>
    </div>
    <div className="p-4 bg-black/20">
      <pre className="whitespace-pre-wrap text-sm text-white/70 font-sans leading-relaxed">{content}</pre>
    </div>
  </div>
);

// 图片展示卡片
const ImageCard = ({ title, src, description }: { title: string; src: string; description?: string }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
    <div className="px-4 py-3 bg-black/30 border-b border-white/10">
      <h4 className="text-sm font-medium text-white">{title}</h4>
    </div>
    <div className="p-4 bg-black/20">
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg h-48 flex items-center justify-center mb-3 border border-white/10">
        <div className="text-center text-white/50">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-xs">创意物料示意</p>
        </div>
      </div>
      {description && <p className="text-xs text-white/50">{description}</p>}
    </div>
  </div>
);

// 对话示例组件
const DialogueExample = ({ messages }: { messages: { sender: string; text: string; isBot?: boolean }[] }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
    <div className="px-4 py-3 bg-black/30 border-b border-white/10">
      <h4 className="text-sm font-medium text-white flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-purple-400" />
        对话示例
      </h4>
    </div>
    <div className="p-4 space-y-3 bg-black/20">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
            msg.isBot ? 'bg-purple-500/20 text-white/90' : 'bg-blue-500/20 text-white/90'
          }`}>
            <p className="text-xs text-white/40 mb-1">{msg.sender}</p>
            <p className="text-sm">{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 迭代计划组件
const IterationPlan = () => {
  const plans = [
    {
      agent: "画像分析智能体",
      icon: Brain,
      color: "#3b82f6",
      tasks: [
        "引入更多行为特征：书签、批注频率、阅读时段",
        "建立学习能力分层模型，动态调整推荐难度",
        "增加跨书籍知识图谱关联分析"
      ],
      target: "画像准确率 85% → 92%"
    },
    {
      agent: "数据补全智能体",
      icon: Database,
      color: "#8b5cf6",
      tasks: [
        "接入电商平台购买数据，分析付费能力",
        "整合社交媒体兴趣标签，丰富用户维度",
        "建立数据质量评分机制，过滤低置信度数据"
      ],
      target: "数据完整度 94% → 98%"
    },
    {
      agent: "广告匹配智能体",
      icon: TargetIcon,
      color: "#10b981",
      tasks: [
        "扩展广告池规模，引入更多垂直领域广告主",
        "优化匹配算法，增加实时竞价考量",
        "引入深度学习模型，提升CTR预测精度"
      ],
      target: "匹配度 86% → 92%"
    },
    {
      agent: "创意生成智能体",
      icon: Sparkles,
      color: "#f97316",
      tasks: [
        "增加A/B测试频率，每周生成新变体",
        "引入情感分析，优化不同人群的文案风格",
        "测试视频广告形式，提升用户注意力"
      ],
      target: "CTR 8.5% → 12%"
    },
    {
      agent: "销售对话智能体",
      icon: MessageCircle,
      color: "#ec4899",
      tasks: [
        "增加更多对话场景识别模板",
        "引入个性化推荐理由生成",
        "优化异议处理话术，提升转化信心"
      ],
      target: "留资率 38% → 48%"
    },
    {
      agent: "优化分析智能体",
      icon: TrendingUp,
      color: "#06b6d4",
      tasks: [
        "实时监控各环节转化率，动态调整流量分配",
        "建立预测模型，提前识别流失风险用户",
        "自动化A/B测试流程，加速迭代周期"
      ],
      target: "CVR 1.25% → 1.8%"
    }
  ];

  return (
    <div className="space-y-4">
      {plans.map((plan, i) => {
        const IconComponent = plan.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-black/30 border border-white/10 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${plan.color}30`, border: `1px solid ${plan.color}50` }}
              >
                <IconComponent className="h-5 w-5" style={{ color: plan.color }} />
              </div>
              <div className="flex-1">
                <h5 className="text-white font-medium">{plan.agent}</h5>
                <p className="text-xs text-green-400">{plan.target}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {plan.tasks.map((task, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-purple-400 mt-1">•</span>
                  {task}
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
};

// 流式文本组件
const StreamingText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="p-4 bg-black/20">
      <pre className="whitespace-pre-wrap text-sm text-white/70 font-sans leading-relaxed">
        {displayedText}
        <span className="animate-pulse">|</span>
      </pre>
    </div>
  );
};

// 数据表格
const DataTable = ({ headers, rows, title }: { headers: string[]; rows: string[][]; title?: string }) => (
  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
    {title && <div className="px-4 py-3 bg-black/30 border-b border-white/10"><h4 className="text-sm font-medium text-white">{title}</h4></div>}
    <div className="bg-black/20 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/20">
            {headers.map((h, i) => <th key={i} className="text-left py-2 px-3 font-medium text-white/80 first:rounded-tl-lg last:rounded-tr-lg">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/10 hover:bg-black/30">
              {row.map((cell, j) => <td key={j} className="py-2 px-3 text-white/60">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 特性卡片组件
const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -5 }}
    className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/40 transition-all"
  >
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-purple-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/60">{description}</p>
  </motion.div>
);

// 流程步骤组件
const ProcessStep = ({ step, icon: Icon, isActive, isCompleted }: { step: string; icon: any; isActive: boolean; isCompleted: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-center gap-3 ${isCompleted ? 'opacity-60' : ''}`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-500/20 text-green-400' : isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'
    }`}>
      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
    </div>
    <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-white/60'}`}>{step}</span>
  </motion.div>
);

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [visibleResults, setVisibleResults] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState<{ [key: string]: string }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const WORKFLOW_DATA: WorkflowStep[] = [
    { id: "1-1", agentId: "profile", type: "思考", label: "读取学习记录", description: "从本地存储读取用户历史学习数据" },
    { id: "1-2", agentId: "profile", type: "思考", label: "解析读书笔记", description: "提取书签、批注、高亮等内容" },
    { id: "1-3", agentId: "profile", type: "思考", label: "计算阅读指标", description: "分析阅读时长、频率、完成度" },
    { id: "1-4", agentId: "profile", type: "工具", label: "画像构建工具", toolName: "画像构建器", description: "生成结构化用户画像" },
    { id: "1-5", agentId: "profile", type: "完成", label: "输出画像报告", isMainOutput: true },
    
    { id: "2-1", agentId: "enrich", type: "思考", label: "查询用户基础信息", description: "补全年龄、职业、地区等" },
    { id: "2-2", agentId: "enrich", type: "思考", label: "分析消费能力", description: "评估支付能力和消费偏好" },
    { id: "2-3", agentId: "enrich", type: "工具", label: "外部数据接口", toolName: "外部数据API", description: "调用第三方数据服务" },
    { id: "2-4", agentId: "enrich", type: "完成", label: "输出增强画像", isMainOutput: true },
    
    { id: "3-1", agentId: "match", type: "思考", label: "解析用户偏好", description: "提取兴趣标签和需求" },
    { id: "3-2", agentId: "match", type: "思考", label: "检索候选广告", description: "从广告池匹配相关内容" },
    { id: "3-3", agentId: "match", type: "工具", label: "广告筛选工具", toolName: "广告筛选器", description: "按规则筛选候选广告" },
    { id: "3-4", agentId: "match", type: "完成", label: "输出匹配结果", isMainOutput: true },
    
    { id: "4-1", agentId: "creative", type: "思考", label: "生成文案变体", description: "多角度创作不同版本" },
    { id: "4-2", agentId: "creative", type: "工具", label: "文案生成工具", toolName: "文案生成器", description: "AI创作广告文案" },
    { id: "4-3", agentId: "creative", type: "完成", label: "输出创意物料", isMainOutput: true },
    
    { id: "5-1", agentId: "sales", type: "思考", label: "分析用户场景", description: "理解用户当前学习情境" },
    { id: "5-2", agentId: "sales", type: "工具", label: "对话生成工具", toolName: "对话引擎", description: "生成销售话术" },
    { id: "5-3", agentId: "sales", type: "完成", label: "输出销售话术", isMainOutput: true },
    
    { id: "6-1", agentId: "optimization", type: "思考", label: "构建漏斗模型", description: "分析各环节转化率" },
    { id: "6-2", agentId: "optimization", type: "工具", label: "漏斗分析工具", toolName: "漏斗分析器", description: "分析转化路径" },
    { id: "6-3", agentId: "optimization", type: "完成", label: "输出优化方案", isMainOutput: true },
  ];

  // 各智能体报告数据
  const AGENT_REPORTS = {
    profile: {
      title: "用户画像分析报告",
      metrics: [
        { label: "当前章节", value: "8/12", subValue: "异常控制流", icon: BookOpen, color: "#3b82f6" },
        { label: "阅读进度", value: "44.8%", subValue: "387/864页", icon: Activity, color: "#10b981", trend: "up" },
        { label: "日均时长", value: "45分钟", subValue: "高于均值18%", icon: Clock, color: "#8b5cf6" },
        { label: "知识掌握", value: "72%", subValue: "整体良好", icon: Brain, color: "#f97316" },
      ],
      charts: [
        {
          type: "radar",
          title: "学习能力雷达图",
          data: [
            { label: "技术理解", value: 85 },
            { label: "实操能力", value: 78 },
            { label: "效率", value: 88 },
            { label: "专注度", value: 72 },
            { label: "进度", value: 90 },
            { label: "潜力", value: 82 },
          ]
        }
      ],
      textCards: [
        {
          title: "阅读行为分析",
          icon: Activity,
          color: "#3b82f6",
          content: `该用户展现出高度自律的学习特征：

• 稳定的学习节奏：每周阅读5.2天，远高于同类读者均值的4.1天
• 高效的笔记习惯：每章节产出12条笔记，是均值的1.5倍
• 主动回看的频率较低（1.8次/章 vs 2.4次均值），表明理解能力较强
• 偏好晚间深度学习，19-21点为黄金时段，占总阅读时长52%`
        }
      ],
      tables: [
        {
          title: "阅读行为数据对比",
          headers: ["行为指标", "当前值", "同类均值", "对比"],
          rows: [
            ["日均阅读时长", "45分钟", "38分钟", "↑ +18%"],
            ["阅读频率", "5.2天/周", "4.1天/周", "↑ +27%"],
            ["回看频率", "1.8次/章", "2.4次/章", "↓ -25%"],
            ["笔记产出", "12条/章", "8条/章", "↑ +50%"],
          ]
        }
      ]
    },
    enrich: {
      title: "用户数据补全报告",
      metrics: [
        { label: "用户年龄", value: "24岁", subValue: "后端工程师", icon: User, color: "#8b5cf6" },
        { label: "月收入", value: "20K", subValue: "中等偏高", icon: DollarSign, color: "#10b981", trend: "up" },
        { label: "教育投入", value: "8-12%", subValue: "占收入比例", icon: TrendingUp, color: "#3b82f6" },
        { label: "数据完整度", value: "94%", subValue: "置信度", icon: Layers, color: "#ec4899" },
      ],
      charts: [
        {
          type: "donut",
          title: "兴趣领域分布",
          data: [
            { label: "技术", value: 45, color: "#3b82f6" },
            { label: "商业", value: 25, color: "#8b5cf6" },
            { label: "设计", value: 15, color: "#ec4899" },
            { label: "管理", value: 10, color: "#10b981" },
            { label: "其他", value: 5, color: "#f97316" },
          ]
        }
      ],
      textCards: [
        {
          title: "用户基础画像",
          icon: User,
          color: "#10b981",
          content: `【基础属性】
• 年龄：24岁 | 性别：男
• 职业：后端开发工程师 | 工作年限：2年
• 城市：深圳 | 学历：本科（计算机专业）
• 技术栈：Python、Go、Java`
        },
        {
          title: "消费能力分析",
          icon: DollarSign,
          color: "#f97316",
          content: `【收入与消费】
• 月收入范围：15,000-25,000元
• 月均消费：8,000-12,000元
• 教育投入占比：8-12%（约1,200-2,400元/月）
• 可接受订阅价格：50-200元/月`
        }
      ]
    },
    match: {
      title: "广告匹配分析报告",
      metrics: [
        { label: "候选广告", value: "100+", subValue: "广告池总量", icon: TargetIcon, color: "#10b981" },
        { label: "平均匹配度", value: "86.2%", subValue: "Top6平均", icon: Activity, color: "#3b82f6" },
        { label: "非教辅占比", value: "63%", subValue: "符合要求", icon: CheckCircle2, color: "#10b981" },
        { label: "预估CTR", value: "8.5%", subValue: "高于均值165%", icon: TrendingUp, color: "#f97316" },
      ],
      charts: [
        {
          type: "area",
          title: "匹配度分布趋势",
          data: [
            { label: "候选1", value: 92 },
            { label: "候选2", value: 88 },
            { label: "候选3", value: 85 },
            { label: "候选4", value: 78 },
            { label: "候选5", value: 82 },
            { label: "候选6", value: 75 },
          ]
        }
      ],
      textCards: [
        {
          title: "推荐广告详情",
          icon: TargetIcon,
          color: "#10b981",
          content: `【TOP1推荐】极客时间年度会员

• 匹配度：96.2% | 预估CTR：8.5%
• 价格：299元/年

【卖点匹配分析】
✓ 系统架构知识 → 契合《深入理解计算机系统》
✓ 延伸学习资源 → 补充书籍内容深度
✓ 目标用户契合 → CSAPP读者占45%`
        }
      ],
      tables: [
        {
          title: "候选广告列表",
          headers: ["排名", "广告名称", "匹配度", "预估CTR", "类型"],
          rows: [
            ["🥇 1", "极客时间年度会员", "96.2%", "8.5%", "技术课程"],
            ["🥈 2", "CSAPP配套实验班", "94.8%", "12.3%", "教辅"],
            ["🥉 3", "JetBrains IDE订阅", "88.5%", "6.2%", "开发工具"],
          ]
        }
      ]
    },
    creative: {
      title: "广告创意生成报告",
      metrics: [
        { label: "Banner", value: "3套", subValue: "1920×600px", icon: Layout, color: "#f97316" },
        { label: "信息流", value: "5套", subValue: "750×300px", icon: Layers, color: "#f97316" },
        { label: "文案", value: "12条", subValue: "多版本", icon: Type, color: "#8b5cf6" },
        { label: "落地页", value: "2套", subValue: "响应式", icon: FileText, color: "#3b82f6" },
      ],
      charts: [
        {
          type: "pie",
          title: "创意类型效果对比",
          data: [
            { label: "Banner", value: 30, color: "#3b82f6" },
            { label: "信息流", value: 50, color: "#8b5cf6" },
            { label: "短视频", value: 15, color: "#ec4899" },
            { label: "落地页", value: 5, color: "#10b981" },
          ]
        }
      ],
      textCards: [
        {
          title: "主Banner创意方案",
          icon: ImageIcon,
          color: "#f97316",
          content: `【方案A - 品牌型】
━━━━━━━━━━━━━━━━━━━━━
🎨 视觉设计
背景：计算机系统书籍+代码编辑器+程序员工作场景
主色调：科技蓝(#3B82F6) + 成长绿(#10B981)

📝 文案内容
标题：正在读《深入理解计算机系统》？
副标题：系统级思维，决定你编程能力的天花板
正文：极客时间年度会员，1500+技术专栏
CTA：限时特惠 年卡仅¥299`
        },
        {
          title: "信息流广告文案",
          icon: PenTool,
          color: "#8b5cf6",
          content: `【短文案（20字内）】
① "学CSAPP没头绪？极客时间帮你打通任督二脉"
② "年薪60万的后端，都在学这个"
③ "系统知识不扎实？可能是你方法不对"

【中文案（50字内）】
"正在学《深入理解计算机系统》？很多程序员卡在第5章链接。
极客时间有配套的实战专栏，帮你把书中的概念真正落地。
现在加入，7天无理由退款。"`
        }
      ],
      imageCards: [
        {
          title: "Banner物料展示 - 方案A",
          src: "",
          description: "1920×600px | 科技蓝+成长绿配色"
        },
        {
          title: "信息流物料 - 卡片式",
          src: "",
          description: "750×300px | 适配移动端"
        }
      ]
    },
    sales: {
      title: "AI销售对话报告",
      metrics: [
        { label: "曝光→点击", value: "25%", subValue: "高于均值", icon: Eye, color: "#3b82f6" },
        { label: "点击→留资", value: "38%", subValue: "高于均值", icon: Users, color: "#8b5cf6" },
        { label: "留资→购买", value: "42%", subValue: "高于均值", icon: CheckCircle2, color: "#10b981" },
        { label: "预估ROI", value: "260%", subValue: "效果优秀", icon: TrendingUp, color: "#f97316" },
      ],
      charts: [
        {
          type: "funnel",
          title: "用户参与度漏斗",
          data: [
            { label: "访问", value: 100, rate: 100 },
            { label: "浏览", value: 72, rate: 72 },
            { label: "互动", value: 45, rate: 45 },
            { label: "留资", value: 25, rate: 25 },
            { label: "转化", value: 12, rate: 12 },
          ]
        }
      ],
      textCards: [
        {
          title: "销售策略设计",
          icon: TargetIcon,
          color: "#ec4899",
          content: `【核心销售策略】

1. 场景化切入
从用户当前的学习场景出发，而非直接推销产品。

2. 痛点共鸣优先
先理解用户的困难，再提供解决方案。

3. 价值前置
强调学习效果，而非价格。

4. 风险消除
降低决策门槛，消除后顾之忧。`
        },
        {
          title: "销售技能库",
          icon: BookMarked,
          color: "#8b5cf6",
          content: `【开场话术技能】
✓ FAB法则：Feature-Advantage-Benefit
✓ 场景化提问建立共鸣
✓ 不直接推销，先建立信任

【异议处理技能】
• "太贵了" → 价值拆解，强调性价比
• "不需要" → 痛点引导，制造需求
• "考虑一下" → 限时优惠，推动决策`
        }
      ],
      dialogueExamples: [
        {
          title: "标准对话流程示例",
          messages: [
            { sender: "AI助手", text: "您好！看到您正在学习《深入理解计算机系统》，这本书确实是计算机经典。", isBot: true },
            { sender: "用户", text: "刚到第8章，感觉有点难", isBot: false },
            { sender: "AI助手", text: "第8章确实是一个难点，我这边有一些学习资料或许能帮到您...", isBot: true },
          ]
        }
      ]
    },
    optimization: {
      title: "优化分析报告",
      metrics: [
        { label: "整体CVR", value: "1.25%", subValue: "高于行业10倍", icon: Activity, color: "#3b82f6", trend: "up" },
        { label: "ROI", value: "150%", subValue: "超预期", icon: DollarSign, color: "#10b981", trend: "up" },
        { label: "CPM", value: "¥12.5", subValue: "成本可控", icon: TrendingDown, color: "#f97316" },
        { label: "CPA", value: "¥8.2", subValue: "低于均值", icon: TrendingDown, color: "#ec4899" },
      ],
      charts: [
        {
          type: "scatter",
          title: "转化率优化分析",
          data: [
            { x: 15, y: 25, size: 6, label: "曝光" },
            { x: 30, y: 38, size: 7, label: "点击" },
            { x: 45, y: 55, size: 8, label: "落地" },
            { x: 60, y: 72, size: 5, label: "留资" },
            { x: 80, y: 90, size: 9, label: "购买" },
          ]
        }
      ],
      textCards: [
        {
          title: "漏斗优化建议",
          icon: TrendingUp,
          color: "#3b82f6",
          content: `【各环节优化策略】

曝光→点击（当前25%）
问题：创意不够吸引，测试变体少
建议：增加A/B测试版本，优化素材

点击→落地（当前72%）
问题：落地页加载慢，部分用户流失
建议：CDN加速，图片压缩优化

落地→留资（当前25%）
问题：表单字段过多，用户嫌麻烦
建议：简化表单，仅保留手机号+验证码`
        }
      ],
      tables: [
        {
          title: "关键指标对比",
          headers: ["指标", "当前值", "行业均值", "差距"],
          rows: [
            ["点击率CTR", "25.0%", "3.2%", "+681%"],
            ["落地率LTR", "72.0%", "65%", "+10.8%"],
            ["留资率", "25.0%", "18%", "+38.9%"],
          ]
        }
      ]
    },
  };

  const runWorkflow = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setWorkflowSteps([]);
    setCompletedAgents([]);
    setVisibleResults([]);
    setStreamingContent({});
    setActiveAgentId(null);

    WORKFLOW_DATA.forEach((step, index) => {
      setTimeout(() => {
        setWorkflowSteps(prev => [...prev, step]);
        
        if (step.isMainOutput) {
          setCompletedAgents(prev => [...prev, step.agentId]);
          setTimeout(() => {
            setVisibleResults(prev => [...prev, step.agentId]);
            setActiveAgentId(step.agentId);
            const report = AGENT_REPORTS[step.agentId as keyof typeof AGENT_REPORTS];
            let fullText = `${report.title}\n\n`;
            report.textCards?.forEach(card => {
              fullText += `【${card.title}】\n${card.content}\n\n`;
            });
            setStreamingContent(prev => ({ ...prev, [step.agentId]: fullText }));
          }, 200);
        }

        if (index === WORKFLOW_DATA.length - 1) {
          setIsRunning(false);
        }
      }, index * 500);
    });
  }, [isRunning]);

  const getAgentInfo = (agentId: string) => AGENTS.find(a => a.id === agentId) || AGENTS[0];

  const scrollToDemo = () => {
    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 英雄页 - 全屏动效背景 */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Hyperspeed 动效背景 */}
        <div className="absolute inset-0 z-0">
          <Hyperspeed
            effectOptions={HERO_HYPERSPEED_OPTIONS}
          />
        </div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f] z-10" />
        
        {/* 内容 */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white/80">云梯科技</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <ShinyText
                text="AI多智能体驱动的"
                speed={3}
                color="#ffffff"
                shineColor="#d8b4fe"
                spread={80}
                className="block"
              />
              <br />
              <ShinyText
                text="实时广告决策系统"
                speed={3}
                delay={0.5}
                color="#c084fc"
                shineColor="#f472b6"
                spread={80}
                className="block"
              />
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
              融合用户建模、广告算法与顶级多模态AI模型，在每一次交互中动态计算最优转化路径，构建自进化的商业系统。
            </p>
            
            <div className="flex items-center justify-center">
              <button 
                onClick={scrollToDemo}
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium text-white flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
              >
                查看Demo演示
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* 向下滚动提示 */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-8 w-8 text-white/40" />
        </motion.div>
      </section>

      {/* 产品特点介绍页 */}
      <section id="features-section" className="py-16 px-4 min-h-screen relative overflow-hidden bg-[#0a0a0f]">
        {/* 背景光效 */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[150px]" />
        </div>
        
        {/* 内容层 */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* 标题区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 px-4"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                AI多智能体协作
              </span>
            </h2>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
              六大核心智能体协同工作，从用户洞察到商业转化，构建完整的智能广告闭环
            </p>
          </motion.div>

          {/* 渐变卡片组件 */}
          <div className="w-full">
            <GradientCards />
          </div>
        </div>
      </section>

      {/* Demo演示区域 */}
      <section id="demo-section" className="py-8 px-4 min-h-[60vh] relative overflow-hidden">
        {/* ColorBends背景特效 */}
        <div className="absolute inset-0 z-0 opacity-60">
          <ColorBends
            colors={["#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]}
            rotation={45}
            speed={0.15}
            scale={1.2}
            frequency={0.8}
            warpStrength={1.2}
            mouseInfluence={0.8}
            parallax={0.3}
            noise={0.1}
            iterations={2}
            intensity={1.2}
            bandWidth={5}
            transparent
          />
        </div>
        
        {/* 内容层 */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* 工具栏 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={runWorkflow} disabled={isRunning} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25">
              {isRunning ? <><Loader2 className="h-4 w-4 animate-spin" />执行中...</> : <><Play className="h-4 w-4" />开始执行</>}
            </button>
            <button onClick={() => { setWorkflowSteps([]); setCompletedAgents([]); setVisibleResults([]); setStreamingContent({}); setActiveAgentId(null); }} className="px-4 py-2.5 border border-white/20 bg-black/30 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-all">
              重置
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
            {/* 左侧：智能体执行流程 */}
            <div className="lg:col-span-3 xl:col-span-3">
              <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 h-full flex flex-col shadow-2xl">
                <div className="p-3 border-b border-white/10">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    智能体执行流程
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5 hidden sm:block">执行中逐步展示各智能体结果</p>
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                  {AGENTS.map((agent) => {
                    const agentSteps = workflowSteps.filter(s => s.agentId === agent.id);
                    const isActive = activeAgentId === agent.id;
                    const isCompleted = completedAgents.includes(agent.id);
                    const hasResult = visibleResults.includes(agent.id);
                    
                    return (
                      <motion.div key={agent.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-2 rounded-lg border transition-all ${isActive ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/50" : isCompleted ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-black/20"}`}>
                        <div className={`flex items-center gap-2 p-2 ${hasResult ? 'cursor-pointer hover:bg-black/30' : 'opacity-60'}`} onClick={() => hasResult && setActiveAgentId(agent.id)}>
                          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={{ backgroundColor: agent.bgLight }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{agent.name}</div>
                            <div className="flex items-center gap-1">
                              {isCompleted ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : agentSteps.length > 0 ? <Loader2 className="h-3 w-3 text-blue-400 animate-spin" /> : <Circle className="h-3 w-3 text-white/30" />}
                              <span className="text-xs text-white/40">{isCompleted ? "完成" : agentSteps.length > 0 ? `${agentSteps.length}步` : "等待"}</span>
                            </div>
                          </div>
                          {hasResult && <ChevronRight className={`h-4 w-4 text-white/40 transition-transform ${isActive ? 'rotate-90' : ''}`} />}
                        </div>
                        
                        <AnimatePresence>
                          {agentSteps.length > 0 && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-2 pb-2 overflow-hidden">
                              <div className="space-y-0.5 border-t border-white/10 pt-2">
                                {agentSteps.map((step) => (
                                  <div key={step.id} className={`text-xs px-2 py-1 rounded ${step.isMainOutput ? "bg-green-500/20 text-green-300 font-medium" : step.type === "工具" ? "bg-purple-500/20 text-purple-300" : "text-white/60"}`}>
                                    <div className="flex items-center gap-1">
                                      <span className="flex-shrink-0">{step.isMainOutput ? "✓" : step.type === "工具" ? "⚙" : "○"}</span>
                                      <span className="truncate">{step.label}</span>
                                    </div>
                                    {step.description && <div className="text-[10px] text-white/30 mt-0.5 ml-4 truncate">{step.description}</div>}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右侧：结果展示区域 */}
            <div className="lg:col-span-9 xl:col-span-9">
              {visibleResults.length === 0 ? (
                <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 flex items-center justify-center h-full min-h-[400px] shadow-2xl">
                  <div className="text-center text-white/30">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-white/40">点击「开始执行」启动工作流</p>
                    <p className="text-sm mt-2 text-white/30">各智能体将逐步执行，完成后在此展示结果</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 智能体切换标签 */}
                  <div className="flex gap-1 p-1 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-x-auto shadow-2xl">
                    {visibleResults.map((agentId) => {
                      const agent = AGENTS.find(a => a.id === agentId)!;
                      const isActive = activeAgentId === agentId;
                      return (
                        <button key={agentId} onClick={() => setActiveAgentId(agentId)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25" : "text-white/60 hover:bg-black/30 hover:text-white"}`}>
                          <img src={agent.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="hidden sm:inline">{agent.name.replace("智能体", "")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 结果内容 */}
                  {activeAgentId && AGENT_REPORTS[activeAgentId as keyof typeof AGENT_REPORTS] && (
                    <motion.div key={activeAgentId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {(() => {
                        const report = AGENT_REPORTS[activeAgentId as keyof typeof AGENT_REPORTS];
                        const agent = getAgentInfo(activeAgentId);
                        
                        return (
                          <>
                            {/* 报告头部 */}
                            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                                <div className="flex items-center gap-3">
                                  <img src={agent.avatar} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-black/30" />
                                  <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">{report.title}</h2>
                                    <p className="text-white/60 text-xs sm:text-sm mt-1 truncate">{agent.name} | {new Date().toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 核心指标 */}
                            {report.metrics && report.metrics.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {report.metrics.map((metric, i) => (
                                  <MetricCard 
                                    key={i} 
                                    label={metric.label} 
                                    value={metric.value} 
                                    subValue={metric.subValue}
                                    icon={metric.icon} 
                                    color={metric.color} 
                                    trend={'trend' in metric ? metric.trend as 'up' | 'down' : undefined}
                                  />
                                ))}
                              </div>
                            )}

                            {/* 图表区域 */}
                            {report.charts && report.charts.length > 0 && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {report.charts.map((chart, i) => {
                                  if (chart.type === "bar") return <BarChart key={i} data={chart.data as {label: string; value: number; color?: string}[]} title={chart.title} />;
                                  if (chart.type === "funnel") return <FunnelChart key={i} data={chart.data as {label: string; value: number; color?: string}[]} title={chart.title} />;
                                  if (chart.type === "scatter") return <ScatterChart key={i} data={chart.data as {x: number; y: number; size: number; label: string}[]} title={chart.title} />;
                                  if (chart.type === "pie") return <PieChart key={i} data={chart.data as {label: string; value: number; color?: string}[]} title={chart.title} />;
                                  if (chart.type === "line") return <LineChart key={i} data={chart.data as {label: string; value: number}[]} title={chart.title} />;
                                  if (chart.type === "radar") return <RadarChart key={i} data={chart.data as {label: string; value: number}[]} title={chart.title} />;
                                  if (chart.type === "donut") return <DonutChart key={i} data={chart.data as {label: string; value: number; color?: string}[]} title={chart.title} />;
                                  if (chart.type === "area") return <AreaChart key={i} data={chart.data as {label: string; value: number}[]} title={chart.title} />;
                                  return null;
                                })}
                              </div>
                            )}

                            {/* 文字分析卡片 */}
                            {report.textCards && report.textCards.length > 0 && (
                              <div className="space-y-4">
                                {report.textCards.map((card, i) => (
                                  <TextCard key={i} title={card.title} content={card.content} icon={card.icon} color={card.color} />
                                ))}
                              </div>
                            )}

                            {/* 对话示例 */}
                            {'dialogueExamples' in report && report.dialogueExamples && report.dialogueExamples.length > 0 && (
                              <div className="space-y-4">
                                {report.dialogueExamples.map((example, i) => (
                                  <DialogueExample key={i} messages={example.messages} />
                                ))}
                              </div>
                            )}

                            {/* 图片卡片 */}
                            {'imageCards' in report && report.imageCards && report.imageCards.length > 0 && (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {report.imageCards.map((card, i) => (
                                  <ImageCard key={i} src={card.src} title={card.title} description={card.description} />
                                ))}
                              </div>
                            )}

                            {/* 数据表格 */}
                            {'tables' in report && report.tables && report.tables.length > 0 && (
                              report.tables.map((table, i) => (
                                <DataTable key={i} title={table.title} headers={table.headers} rows={table.rows} />
                              ))
                            )}

                            {/* 流式文字输出 */}
                            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                              <div className="px-4 py-2 bg-black/30 border-b border-white/10">
                                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                  {activeAgentId === 'optimization' ? (
                                    <>
                                      <TrendingUp className="h-4 w-4 text-green-400" />
                                      下一步迭代计划
                                    </>
                                  ) : (
                                    <>
                                      <Activity className="h-4 w-4 text-purple-400" />
                                      分析报告摘要
                                    </>
                                  )}
                                </h4>
                              </div>
                              {activeAgentId === 'optimization' ? (
                                <div className="p-4 space-y-4">
                                  <IterationPlan />
                                </div>
                              ) : (
                                <StreamingText text={streamingContent[activeAgentId] || ""} />
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-12 px-4 bg-[#0a0a0f] border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">广告流量智能系统</span>
          </div>
          <p className="text-sm text-white/40">AI驱动的多智能体实时广告决策平台</p>
        </div>
      </footer>
    </div>
  );
}
