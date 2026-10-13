/**
 * Motion's animation features, imported only through {@link loadMotionFeatures} so they load in
 * their own chunk after the first paint instead of in the initial bundle (performance.md).
 * `domMax` includes layout animations, which the sliding indicators need.
 */
export { domMax } from "motion/react";
