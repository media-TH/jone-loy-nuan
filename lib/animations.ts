export const EASE = {
  default: "easeInOut" as const,
  in: "easeIn" as const,
  out: "easeOut" as const,
};

export const DURATION = {
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  xslow: 1.0,
};

export const SPRING = {
  soft: { type: "spring" as const, damping: 20, stiffness: 200 },
  firm: { type: "spring" as const, damping: 25, stiffness: 300 },
};

