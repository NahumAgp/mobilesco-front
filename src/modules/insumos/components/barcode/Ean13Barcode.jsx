import { obtenerBitsEan13 } from "./ean13Utils.js";

export function Ean13BarcodeSvg({ value, title, width = 280, height = 136, showText = true }) {
  const bits = obtenerBitsEan13(value);
  const hasTitle = Boolean(title);
  const titleSpace = hasTitle ? 20 : 0;
  const codeSpace = showText ? 28 : 0;
  const barcodeHeight = height - titleSpace - codeSpace;
  const moduleWidth = width / 95;

  if (!bits) {
    return null;
  }

  return (
    <svg
      className="ean13-barcode-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Codigo de barras ${title ? `${title}, ` : ""}${value}`}
    >
      <rect width={width} height={height} fill="#ffffff" />
      {hasTitle && (
        <text
          x={width / 2}
          y="16"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fontWeight="700"
          fill="#111827"
          textLength={width - 24}
          lengthAdjust="spacingAndGlyphs"
        >
          {title}
        </text>
      )}
      {bits.split("").map((bit, index) =>
        bit === "1" ? (
          <rect
            key={`${value}-${index}`}
            x={index * moduleWidth}
            y={titleSpace}
            width={Math.ceil(moduleWidth * 1000) / 1000}
            height={barcodeHeight}
            fill="#111827"
          />
        ) : null
      )}
      {showText && (
        <text
          x={width / 2}
          y={height - 7}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="16"
          letterSpacing="2"
          fill="#111827"
          textLength={width - 20}
          lengthAdjust="spacingAndGlyphs"
        >
          {value}
        </text>
      )}
    </svg>
  );
}
