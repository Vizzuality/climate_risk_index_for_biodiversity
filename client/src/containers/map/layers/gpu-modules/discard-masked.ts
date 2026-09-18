import type { ShaderModule } from "@luma.gl/shadertools";

// The rasters carry the value in the red channel and a 0/255 alpha band in
// green; NaN marks pixels with no modelled value.
export const DiscardMasked = {
  name: "discardMasked",
  inject: {
    "fs:DECKGL_FILTER_COLOR": /* glsl */ `
      if (isnan(color.r) || color.g == 0.0) {
        discard;
      }
    `,
  },
} as const satisfies ShaderModule;
