"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, ReferenceLine } from "recharts";

interface SparklineCellProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showZero?: boolean;
  animationDelay?: number;
}

export function SparklineCell({
  data,
  color = "#60a5fa",
  width = 120,
  height = 32,
  showZero = false,
  animationDelay = 0,
}: SparklineCellProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  const hasNegative = data.some(v => v < 0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          {(showZero || hasNegative) && (
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
          )}
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={!prefersReducedMotion}
            animationBegin={animationDelay}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
