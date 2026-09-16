export const RISK_CLASSES = [
  { min: 0, color: "#45B9C7" },
  { min: 0.25, color: "#B5E2D1" },
  { min: 0.5, color: "#F1BC83" },
  { min: 0.75, color: "#D95730" },
] as const;

export const COLORMAP_WIDTH = 256;

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function riskColorFor(value: number): string {
  let color: string = RISK_CLASSES[0].color;
  for (const cls of RISK_CLASSES) {
    if (value >= cls.min) color = cls.color;
  }
  return color;
}

// One RGBA row of COLORMAP_WIDTH texels: texel i holds the colour of the
// class that value i / (COLORMAP_WIDTH - 1) falls in.
export function buildRiskColormap(): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(COLORMAP_WIDTH * 4));
  for (let i = 0; i < COLORMAP_WIDTH; i++) {
    const [r, g, b] = hexToRgb(riskColorFor(i / (COLORMAP_WIDTH - 1)));
    out.set([r, g, b, 255], i * 4);
  }
  return out;
}
