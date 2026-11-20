"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { platformColors } from "@/lib/platforms";
import { PLATFORMS, type Platform } from "@/lib/model";

const axis = { fill: "#54705B", fontSize: 10 };
const tooltipStyle = { backgroundColor: "#FBFEFA", border: "1px solid #D7E7D7", borderRadius: 12, boxShadow: "0 12px 32px rgba(35,79,44,.14)", color: "#173B27", fontSize: 11 };

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

export function PlatformChart({ data, onSelect }: { data: { name: string; value: number }[]; onSelect: (name: string) => void }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length) return <div className="chart-wrap compact"><div className="chart-empty">No platform accounts are available yet.</div></div>;
  const colors = data.map((item) => {
    const platform = PLATFORMS.find((candidate) => candidate === item.name);
    return platform ? platformColors[platform] : "#8aa392";
  });
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={55} outerRadius={80} paddingAngle={3} onClick={(entry) => onSelect(String(entry.name))} cursor="pointer" isAnimationActive={!reducedMotion} animationDuration={550} animationEasing="ease-out">
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index]} stroke="#F0F7EF" strokeWidth={2} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} creators`, name]} />
        </PieChart>
      </ResponsiveContainer>
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
  if (!data.length) return <div className="chart-wrap compact"><div className="chart-empty">No dated snapshots in this range.</div></div>;
  return (
    <>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 3 }}>
            <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="date" tick={axis} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={48} tickFormatter={shortNumber} label={{ value: label, angle: -90, position: "insideLeft", fill: "#54705B", fontSize: 9 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [Number(value).toLocaleString(), series ? name : label]} />
            {series && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />}
            {(series ?? ["value"]).map((key) => {
              const stroke = series
                ? platformColors[key as Platform] ?? "#367C4B"
                : "#367C4B";
              return <Line key={key} type={data.length <= 2 ? "linear" : "monotone"} dataKey={key} name={key} stroke={stroke} strokeWidth={2.5} dot={false} activeDot={false} connectNulls={false} isAnimationActive={!reducedMotion} animationDuration={550} animationEasing="ease-out" />;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.length <= 2 && <div className="chart-sparse-note" role="status">Sparse coverage: {data.length} dated {data.length === 1 ? "point" : "points"}. Lines connect observations only.</div>}
    </>
  );
}

export function CategoryChart({ data, onSelect, itemLabel = "creators" }: { data: { name: string; count: number }[]; onSelect: (name: string) => void; itemLabel?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length) return <div className="chart-wrap compact"><div className="chart-empty">No categorized creators available.</div></div>;
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 5, right: 17, top: 3, bottom: 3 }} onClick={(event) => {
          const item = (event as { activePayload?: { payload?: { name?: string } }[] } | null)?.activePayload?.[0]?.payload;
          if (item?.name) onSelect(item.name);
        }}>
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={86} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} ${itemLabel}`, "Profiles"]} />
          <Bar dataKey="count" fill="#367C4B" radius={[0, 6, 6, 0]} barSize={13} cursor="pointer" isAnimationActive={!reducedMotion} animationDuration={500} animationEasing="ease-out" />
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
  if (!data.length) return <div className="chart-wrap compact"><div className="chart-empty">No sourced audience values are available.</div></div>;
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 18, top: 2, bottom: 2 }} onClick={(event) => {
          const item = (event as { activePayload?: { payload?: { name?: string } }[] } | null)?.activePayload?.[0]?.payload;
          if (item?.name) onSelect(item.name);
        }}>
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString()}${suffix}`, "Average sourced share"]} />
          <Bar dataKey="value" fill="#79A85F" radius={[0, 6, 6, 0]} barSize={13} cursor="pointer" isAnimationActive={!reducedMotion} animationDuration={500} animationEasing="ease-out" />
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
  if (!data.length) return <div className="chart-wrap compact"><div className="chart-empty">No sourced metric values are available.</div></div>;
  return (
    <div className="chart-wrap compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 3, right: 18, top: 2, bottom: 2 }} onClick={(event) => {
          const item = (event as { activePayload?: { payload?: ComparisonDatum }[] } | null)?.activePayload?.[0]?.payload;
          if (item?.platform) onSelect(item.platform);
        }}>
          <CartesianGrid stroke="rgba(55,112,68,.14)" strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={shortNumber} />
          <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={92} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toLocaleString(), valueLabel]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={13} cursor="pointer" isAnimationActive={!reducedMotion} animationDuration={500} animationEasing="ease-out">
            {data.map((item) => <Cell key={`${item.platform}-${item.name}`} fill={platformColors[item.platform]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function shortNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
