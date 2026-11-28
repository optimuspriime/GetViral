"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette, Check, X } from "lucide-react";
import { hexToHsl, hslToHex, normalizeHexColor } from "@/lib/appearance";

const SPECTRUM_SWATCHES = [
  "#16834B",
  "#0D9488",
  "#4D7C0F",
  "#E59A1A",
  "#F97316",
  "#D9465F",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#06B6D4",
];

export function ColorWheelPicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}) {
  const normalized = normalizeHexColor(value) ?? "#16834B";
  const initialHsl = hexToHsl(normalized);
  const [hue, setHue] = useState(initialHsl.h);
  const [saturation, setSaturation] = useState(Math.max(25, initialHsl.s));
  const [lightness, setLightness] = useState(Math.min(72, Math.max(24, initialHsl.l)));
  const [hexDraft, setHexDraft] = useState(normalized);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);

  // Sync internal HSL state if external hex changes
  useEffect(() => {
    const clean = normalizeHexColor(value);
    if (!clean || clean === hexDraft) return;
    const hsl = hexToHsl(clean);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    setHexDraft(clean);
  }, [value, hexDraft]);

  // Draw smooth 360-degree full-spectrum HSL color wheel canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const radius = size / 2;
    const image = ctx.createImageData(size, size);
    const data = image.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;

        if (dist <= radius) {
          let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angleDeg < 0) angleDeg += 360;
          const sat = Math.min(1, dist / radius);
          const lNorm = lightness / 100;

          // HSL -> RGB inline for crisp per-pixel color graph rendering
          const k = (n: number) => (n + angleDeg / 30) % 12;
          const a = sat * Math.min(lNorm, 1 - lNorm);
          const f = (n: number) =>
            lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

          // Feather outer 1.5px edge smoothly for anti-aliasing
          const edgeAlpha = dist > radius - 1.5 ? Math.max(0, (radius - dist) / 1.5) : 1;

          data[idx] = Math.round(f(0) * 255);
          data[idx + 1] = Math.round(f(8) * 255);
          data[idx + 2] = Math.round(f(4) * 255);
          data[idx + 3] = Math.round(edgeAlpha * 255);
        } else {
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [lightness]);

  function pickFromPointer(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = clientX - rect.left - cx;
    const dy = clientY - rect.top - cy;
    const dist = Math.min(cx, Math.sqrt(dx * dx + dy * dy));

    let nextHue = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (nextHue < 0) nextHue += 360;
    const nextSat = Math.round((dist / cx) * 100);
    const nextHex = hslToHex(nextHue, nextSat, lightness);

    setHue(nextHue);
    setSaturation(nextSat);
    setHexDraft(nextHex);
    onChange(nextHex);
  }

  function handleLightnessChange(nextL: number) {
    setLightness(nextL);
    const nextHex = hslToHex(hue, saturation, nextL);
    setHexDraft(nextHex);
    onChange(nextHex);
  }

  function handleHexInput(raw: string) {
    setHexDraft(raw);
    const valid = normalizeHexColor(raw);
    if (valid) {
      const hsl = hexToHsl(valid);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
      onChange(valid);
    }
  }

  const angleRad = (hue * Math.PI) / 180;
  const puckRadiusPct = (Math.min(100, Math.max(0, saturation)) / 100) * 50;
  const puckLeftPct = 50 + Math.cos(angleRad) * puckRadiusPct;
  const puckTopPct = 50 + Math.sin(angleRad) * puckRadiusPct;

  return (
    <div
      className="color-wheel-popover"
      role="region"
      aria-label="Custom color wheel graph picker"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="color-wheel-header">
        <div>
          <strong>Custom Color Wheel</strong>
          <span>Drag anywhere on the color graph or enter a hex shade</span>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close color wheel"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="color-wheel-body">
        <div
          className="color-wheel-canvas-wrap"
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            pickFromPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) {
              pickFromPointer(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
        >
          <canvas
            ref={canvasRef}
            width={184}
            height={184}
            className="color-wheel-canvas"
            aria-label="Color wheel spectrum"
          />
          <span
            className="color-wheel-puck"
            style={{
              left: `${puckLeftPct}%`,
              top: `${puckTopPct}%`,
              backgroundColor: normalized,
            }}
            aria-hidden="true"
          />
        </div>

        <div className="color-wheel-controls">
          <div className="color-slider-block">
            <div className="color-slider-label">
              <span>Tone &amp; Brightness</span>
              <span className="tabular-nums">{lightness}%</span>
            </div>
            <input
              type="range"
              min="22"
              max="78"
              value={lightness}
              aria-label="Color brightness"
              className="color-lightness-slider"
              style={{
                background: `linear-gradient(90deg, ${hslToHex(hue, saturation, 22)}, ${hslToHex(hue, saturation, 50)}, ${hslToHex(hue, saturation, 78)})`,
              }}
              onChange={(e) => handleLightnessChange(Number(e.target.value))}
            />
          </div>

          <div className="color-hex-row">
            <label className="color-native-label" title="Open system color dropper">
              <span className="color-preview-chip" style={{ backgroundColor: normalized }} />
              <Pipette size={13} />
              <input
                type="color"
                aria-label="System color picker"
                value={normalized}
                onChange={(e) => handleHexInput(e.target.value)}
                className="color-native-input"
              />
            </label>
            <input
              type="text"
              aria-label="Hex color code"
              value={hexDraft}
              maxLength={7}
              spellCheck={false}
              className="filter-input color-hex-input tabular-nums"
              onChange={(e) => handleHexInput(e.target.value)}
            />
          </div>

          <div className="color-quick-spectrum" aria-label="Quick spectrum dots">
            {SPECTRUM_SWATCHES.map((swatch) => {
              const isSelected = normalized === swatch;
              return (
                <button
                  key={swatch}
                  type="button"
                  title={swatch}
                  aria-label={`Select color ${swatch}`}
                  aria-pressed={isSelected}
                  className={`spectrum-dot-btn ${isSelected ? "active" : ""}`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => handleHexInput(swatch)}
                >
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
