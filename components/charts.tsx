"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { platformColors } from "@/lib/platforms";
import { PLATFORMS, type Platform } from "@/lib/model";

const axis = { fill: "#54705B", fontSize: 10 };
const tooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D7E7D7",
  borderRadius: 12,
  boxShadow: "0 12px 32px rgba(35,79,44,.14)",
  color: "#173B27",
  fontSize: 11,
  padding: "10px 14px",
};

const categoryPalette = [
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);
  return reducedMotion;
}

export function PlatformChart({
  data,
  onSelect,
}: {
  data: { name: string; value: number }[];
  onSelect: (name: string) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">No platform accounts are available yet.</div>
      </div>
    );

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="chart-wrap compact" style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={55}
            outerRadius={84}
            paddingAngle={3}
            onClick={(entry) => onSelect(String(entry.name))}
            cursor="pointer"
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            animationEasing="ease-out"
          >
            {data.map((entry) => {
              const platform = PLATFORMS.find((candidate) => candidate === entry.name);
              const color = platform ? platformColors[platform] : "#8aa392";
              return (
                <Cell
                  key={entry.name}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              );
            })}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => {
              const count = Number(value);
              const pct = Math.round((count / (total || 1)) * 100);
              return [`${count.toLocaleString()} creators (${pct}%)`, String(name)];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center-badge" aria-hidden="true">
        <span className="donut-center-count">{total.toLocaleString()}</span>
        <span className="donut-center-label">Profiles</span>
      </div>
    </div>
  );
}

export function TrendChart({
  data,
  label,
  series,
}: {
  data: Array<Record<string, string | number | null>>;
  label: string;
  series?: string[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [activePlatform, setActivePlatform] = useState<string>("All");

  if (!data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">No dated snapshots in this range.</div>
      </div>
    );

  const activeSeries = useMemo(() => {
    if (!series) return ["value"];
    if (activePlatform === "All") return series;
    return [activePlatform];
  }, [series, activePlatform]);

  // Compute min and max values across active series to prevent flat line perception
  const [minVal, maxVal] = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    data.forEach((row) => {
      activeSeries.forEach((s) => {
        const val = Number(row[s]);
        if (!isNaN(val) && val > 0) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });
    if (min === Infinity) return [0, 100];
    const padding = Math.max(1, (max - min) * 0.15);
    const calculatedMin = Math.max(0, Math.floor(min - padding));
    let calculatedMax = Math.ceil(max + padding);
    if (calculatedMax <= calculatedMin) {
      calculatedMax = calculatedMin + 10;
    }
    return [calculatedMin, calculatedMax];
  }, [data, activeSeries]);

  return (
    <>
      {/* Interactive Platform Switcher */}
      {series && series.length > 1 && (
        <div className="chart-series-bar" role="tablist" aria-label="Filter chart by platform">
          <button
            type="button"
            className={`series-pill ${activePlatform === "All" ? "active" : ""}`}
            onClick={() => setActivePlatform("All")}
          >
            All Platforms
          </button>
          {series.map((s) => {
            const color = platformColors[s as Platform] ?? "#367C4B";
            const isActive = activePlatform === s;
            return (
              <button
                key={s}
                type="button"
                className={`series-pill ${isActive ? "active" : ""}`}
                style={isActive ? { borderColor: color, color } : {}}
                onClick={() => setActivePlatform(s)}
              >
                <span className="series-dot" style={{ background: color }} />
                <span>{s}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 18, left: 10, bottom: 6 }}>
            <CartesianGrid stroke="rgba(55,112,68,.12)" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="date" tick={axis} axisLine={false} tickLine={false} dy={8} />
            <YAxis
              tick={axis}
              axisLine={false}
              tickLine={false}
              width={66}
              dx={-2}
              tickFormatter={shortNumber}
              domain={[minVal, maxVal]}
              label={{
                value: label,
                angle: -90,
                position: "insideLeft",
                offset: 12,
                fill: "#54705B",
                fontSize: 9,
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} ${label.toLowerCase()}`,
                String(name),
              ]}
              labelFormatter={(dateStr) => `Audit Date: ${dateStr}`}
            />
            {series && activePlatform === "All" && (
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
            )}
            {activeSeries.map((key) => {
              const stroke = series
                ? platformColors[key as Platform] ?? "#367C4B"
                : "#367C4B";
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={stroke}
                  strokeWidth={2.8}
                  dot={{ r: 3, stroke: "#ffffff", strokeWidth: 1.5, fill: stroke }}
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2, fill: stroke }}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-help-caption">
        <span>
          💡 <strong>Audience Trajectory:</strong> Points represent verified snapshot audits.
          {activePlatform === "All"
            ? " Click any platform pill above to zoom into its trajectory curve."
            : ` Showing isolated growth curve for ${activePlatform}.`}
        </span>
      </div>

      {data.length <= 2 && (
        <div className="chart-sparse-note" role="status">
          Sparse coverage: {data.length} dated {data.length === 1 ? "point" : "points"}. Lines connect observations only.
        </div>
      )}
    </>
  );
}

export function CategoryChart({
  data,
  onSelect,
  itemLabel = "creators",
}: {
  data: { name: string; count: number }[];
  onSelect: (name: string) => void;
  itemLabel?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">No categorized creators available.</div>
      </div>
    );
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 5, right: 17, top: 3, bottom: 3 }}
          onClick={(event) => {
            const item = (
              event as { activePayload?: { payload?: { name?: string } }[] } | null
            )?.activePayload?.[0]?.payload;
            if (item?.name) onSelect(item.name);
          }}
        >
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={86}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} ${itemLabel}`, "Profiles"]}
          />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            barSize={13}
            cursor="pointer"
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={categoryPalette[index % categoryPalette.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type ComparisonDatum = { name: string; value: number; platform: Platform };

export function HorizontalValueChart({
  data,
  suffix,
  onSelect,
}: {
  data: { name: string; value: number }[];
  suffix: string;
  onSelect: (name: string) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">No sourced audience values are available.</div>
      </div>
    );
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 18, top: 2, bottom: 2 }}
          onClick={(event) => {
            const item = (
              event as { activePayload?: { payload?: { name?: string } }[] } | null
            )?.activePayload?.[0]?.payload;
            if (item?.name) onSelect(item.name);
          }}
        >
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [
              `${Number(value).toLocaleString()}${suffix}`,
              "Average sourced share",
            ]}
          />
          <Bar
            dataKey="value"
            fill="#2E8B57"
            radius={[0, 6, 6, 0]}
            barSize={13}
            cursor="pointer"
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={categoryPalette[(index + 3) % categoryPalette.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonBarChart({
  data,
  valueLabel,
  onSelect,
}: {
  data: ComparisonDatum[];
  valueLabel: string;
  onSelect: (platform: Platform) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">No sourced metric values are available.</div>
      </div>
    );
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 3, right: 18, top: 2, bottom: 2 }}
          onClick={(event) => {
            const item = (
              event as { activePayload?: { payload?: ComparisonDatum }[] } | null
            )?.activePayload?.[0]?.payload;
            if (item?.platform) onSelect(item.platform);
          }}
        >
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis
            type="number"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={shortNumber}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={92}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [Number(value).toLocaleString(), valueLabel]}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            barSize={13}
            cursor="pointer"
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((item) => (
              <Cell
                key={`${item.platform}-${item.name}`}
                fill={platformColors[item.platform]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function shortNumber(value: number) {
  if (typeof value !== "number" || isNaN(value)) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}
