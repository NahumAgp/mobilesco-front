import { useMemo, useRef } from "react";
import "./ColorPickerEditor.css";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeHex = (hex) => {
  const value = String(hex || "").trim().replace("#", "");
  return /^[0-9a-fA-F]{6}$/.test(value) ? `#${value.toUpperCase()}` : "#FF107A";
};

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const rgbToHsv = ({ r, g, b }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === red) h = 60 * (((green - blue) / delta) % 6);
    else if (max === green) h = 60 * ((blue - red) / delta + 2);
    else h = 60 * ((red - green) / delta + 4);
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
};

const hsvToRgb = ({ h, s, v }) => {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const m = v - chroma;
  let rgb = [0, 0, 0];

  if (section < 1) rgb = [chroma, x, 0];
  else if (section < 2) rgb = [x, chroma, 0];
  else if (section < 3) rgb = [0, chroma, x];
  else if (section < 4) rgb = [0, x, chroma];
  else if (section < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return {
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255
  };
};

export default function ColorPickerEditor({ value, onChange, error }) {
  const saturationRef = useRef(null);
  const rgb = useMemo(() => hexToRgb(value), [value]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const hueColor = rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 }));

  const emitHsv = (next) => onChange(rgbToHex(hsvToRgb(next)));

  const updateSaturation = (event) => {
    const bounds = saturationRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const s = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const v = 1 - clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    emitHsv({ ...hsv, s, v });
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSaturation(event);
  };

  const handlePointerMove = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateSaturation(event);
    }
  };

  const updateRgb = (channel, rawValue) => {
    const nextValue = clamp(Number(rawValue) || 0, 0, 255);
    onChange(rgbToHex({ ...rgb, [channel]: nextValue }));
  };

  const updateHex = (rawValue) => {
    const clean = rawValue.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    onChange(`#${clean.toUpperCase()}`);
  };

  return (
    <div className="color-picker-editor">
      <div className="color-picker-main">
        <div
          ref={saturationRef}
          className="color-picker-saturation"
          style={{ backgroundColor: hueColor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <span
            className="color-picker-cursor"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
          />
        </div>

        <div className="color-picker-hue-wrap">
          <input
            className="color-picker-hue"
            type="range"
            min="0"
            max="359"
            value={Math.round(hsv.h)}
            onChange={(event) => emitHsv({ ...hsv, h: Number(event.target.value) })}
            aria-label="Tono del color"
          />
        </div>
      </div>

      <div className="color-picker-values">
        <div className="color-picker-preview" style={{ backgroundColor: normalizeHex(value) }} />

        <label>
          Rojo
          <input type="number" min="0" max="255" value={rgb.r} onChange={(e) => updateRgb("r", e.target.value)} />
        </label>
        <label>
          Verde
          <input type="number" min="0" max="255" value={rgb.g} onChange={(e) => updateRgb("g", e.target.value)} />
        </label>
        <label>
          Azul
          <input type="number" min="0" max="255" value={rgb.b} onChange={(e) => updateRgb("b", e.target.value)} />
        </label>
        <label>
          Hex
          <input
            type="text"
            value={String(value || "").replace("#", "")}
            onChange={(e) => updateHex(e.target.value)}
            maxLength="6"
          />
        </label>
        {error && <div className="color-picker-error">{error}</div>}
      </div>
    </div>
  );
}
