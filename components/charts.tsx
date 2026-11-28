"use client";

import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { platformColors } from "@/lib/platforms";
import { PLATFORMS, type Platform } from "@/lib/model";
import { formatCompactNumber, formatExactNumber } from "@/lib/format";

const axis = { fill: "#416453", fontSize: 10.5, fontWeight: 500 };
const tooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  border: "1px solid rgba(22, 131, 75, 0.22)",
  borderRadius: 12,
  boxShadow: "0 14px 32px rgba(23, 58, 43, 0.12)",
  color: "#173A2B",
  fontSize: 11.5,
  fontVariantNumeric: "tabular-nums" as const,
  padding: "10px 14px",
};

// Restrained RGB-balanced studio spectrum anchored in emerald, lime, coral, violet, and amber
const categoryPalette = [
  "#16834B", // Studio Emerald
  "#65A30D", // Fresh Lime-Moss
  "#F06478", // Warm Coral
  "#8B5CF6", // Electric Violet
  "#E59A1A", // Golden Amber
  "#14B8A6", // Crisp Mint-Teal
  "#E11D48", // Vivid Rose
  "#84CC16", // Highlight Lime
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      const appOverride = document.documentElement.dataset.reduceMotion === "true";
      setReducedMotion(preference.matches || appOverride);
    };
    updatePreference();
    preference.addEventListener("change", updatePreference);
    window.addEventListener("gv-appearance-change", updatePreference);
    return () => {
      preference.removeEventListener("change", updatePreference);
      window.removeEventListener("gv-appearance-change", updatePreference);
    };
  }, []);
  return reducedMotion;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export function PlatformChart({
  data,
  onSelect,
}: {
  data: { name: string; value: number }[];
  onSelect: (name: string) => void;
}) {
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  if (!mounted || !data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">{!mounted ? "Loading platform metrics..." : "No platform accounts are available yet."}</div>
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
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  const [activePlatform, setActivePlatform] = useState<string>("All");

  const activeSeries = useMemo(() => {
    if (!series) return ["value"];
    if (activePlatform === "All") return series;
    return [activePlatform];
  }, [series, activePlatform]);

  // Compute min and max values across active series to prevent flat line perception
  const [minVal, maxVal] = useMemo(() => {
    if (!data.length) return [0, 100];
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

  if (!mounted || !data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">{!mounted ? "Loading timeline..." : "No dated snapshots in this range."}</div>
      </div>
    );

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
              cursor={{ stroke: "#16834B", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              formatter={(value, name) => [
                `${formatExactNumber(Number(value))} ${label.toLowerCase()}`,
                String(name),
              ]}
              labelFormatter={(dateStr) => `Audit Date: ${dateStr}`}
            />
            {series && activePlatform === "All" && (
              <Legend wrapperStyle={{ fontSize: 10.5, paddingTop: 6, color: "#416453" }} />
            )}
            {activeSeries.map((key) => {
              const stroke = series
                ? platformColors[key as Platform] ?? "#16834B"
                : "#16834B";
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={stroke}
                  strokeWidth={2.75}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2, fill: stroke }}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-help-caption">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Info size={13} style={{ color: "#16834B", flexShrink: 0 }} />
          <span>
            <strong>Audience Trajectory:</strong> Curve connects stored observation audits.
            {activePlatform === "All"
              ? " Select a platform pill above to isolate its trajectory curve."
              : ` Showing isolated growth curve for ${activePlatform}.`}
          </span>
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
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  if (!mounted || !data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">{!mounted ? "Loading categories..." : "No categorized creators available."}</div>
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
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  if (!mounted || !data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">{!mounted ? "Loading audience..." : "No sourced audience values are available."}</div>
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
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  if (!mounted || !data.length)
    return (
      <div className="chart-wrap compact">
        <div className="chart-empty">{!mounted ? "Loading comparisons..." : "No sourced metric values are available."}</div>
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
            formatter={(value) => [formatExactNumber(Number(value)), valueLabel]}
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
  return formatCompactNumber(value);
}
