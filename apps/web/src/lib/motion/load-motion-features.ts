import type { FeatureBundle } from "motion/react";

/**
 * Loads Motion's features lazily for `<LazyMotion features={loadMotionFeatures}>`. Animations
 * start once the chunk arrives; until then elements render in their final state.
 */
export async function loadMotionFeatures(): Promise<FeatureBundle> {
  const { domMax } = await import("./motion-features");
  return domMax;
}
