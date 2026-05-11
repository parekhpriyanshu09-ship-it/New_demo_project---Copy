"use client";

import * as React from "react";
import { Pie, PieChart as RechartsPieChart, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface EvilPieChartProps {
  data: Record<string, any>[];
  dataKey: string;
  nameKey: string;
  chartConfig: any;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  isClickable?: boolean;
  onValueChange?: (value: string) => void;
  showLabels?: boolean;
}

export function EvilPieChart({
  data,
  dataKey,
  nameKey,
  chartConfig,
  className,
  innerRadius = 60,
  outerRadius = 90,
  isClickable = false,
  onValueChange,
  showLabels = true,
}: EvilPieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const handleClick = (data: unknown, index: number) => {
    if (isClickable) {
      setActiveIndex(index);
      const item = data as Record<string, string | number>;
      if (onValueChange && item[nameKey]) {
        onValueChange(String(item[nameKey]));
      }
    }
  };

  const handleMouseEnter = (_: any, index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const getColor = (index: number, key: string) => {
    const config = chartConfig[key];
    if (config?.colors?.light) {
      return config.colors.light[0];
    }
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#6b7280",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={5}
            dataKey={dataKey}
            nameKey={nameKey}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: isClickable ? "pointer" : "default",
              outline: "none",
            }}
          >
            {data.map((entry, index) => {
              const key = String(entry[nameKey]);
              const isActive = activeIndex === index;
              const isHovered = hoveredIndex === index;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(index, key)}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={activeIndex !== null && !isActive ? 0.5 : 1}
                  style={{
                    filter: isHovered ? `drop-shadow(0px 0px 8px ${getColor(index, key)})` : 'none',
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              );
            })}
            {showLabels && (
              <LabelList
                dataKey={nameKey}
                position="outside"
                style={{
                  fontSize: "10px",
                  fill: "#64748b",
                  fontWeight: 500,
                }}
              />
            )}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [value, name]}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}