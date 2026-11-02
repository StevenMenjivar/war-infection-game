/** Iluminación de supervivencia: la linterna es indispensable fuera del pequeño radio local. */
export const LIGHTING_CONFIG = {
  /** Con linterna encendida, el haz es la fuente principal; el entorno permanece oscuro. */
  flashlightAmbientRadii: [145, 275, 455] as const,
  flashlightDarknessAlpha: [0.18, 0.25, 0.34] as const,
  /** Sin linterna, el operador apenas distingue el espacio inmediato. */
  darkAmbientRadii: [38, 66, 108] as const,
  darkDarknessAlpha: [0.64, 0.74, 0.82] as const,
  flashlightRange: 690,
  flashlightApertureDegrees: 62,
  visibilityRayCount: 60,
  updateIntervalMs: 33,
  cornerRayEpsilon: 0.0015,
  ambientGlowAlpha: 0.0025,
  ambientGlowRadius: 24,
  beamAlpha: 0.11,
  canvasDarknessAlphaOff: 0.88,
  canvasDarknessAlphaOn: 0.38,
} as const;
