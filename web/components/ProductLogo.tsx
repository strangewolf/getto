"use client";

import { motion } from "motion/react";
import { useId } from "react";

type Props = {
  className?: string;
  size?: number;
  animated?: boolean;
};

/** Abstract chamfered portal mark — product logo */
export function ProductLogo({ className = "", size = 40, animated = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const gl = `slp-g-l-${uid}`;
  const gd = `slp-g-d-${uid}`;

  const s = size;
  const c = 5 * (s / 40);
  const d = `M ${c} 0 L ${s} 0 L ${s} ${s - c} L ${s - c} ${s} L 0 ${s} L 0 ${c} Z`;

  const is = s * 0.42;
  const ox = (s - is) / 2;
  const oy = (s - is) / 2;
  const ic = c * 0.5;
  const id = `M ${ox + ic} ${oy} L ${ox + is} ${oy} L ${ox + is} ${oy + is - ic} L ${ox + is - ic} ${oy + is} L ${ox} ${oy + is} L ${ox} ${oy + ic} Z`;

  const wrap = animated
    ? {
        initial: { opacity: 0, scale: 0.88, rotate: -6 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {};

  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      aria-hidden
      role="img"
      {...wrap}
    >
      <defs>
        <linearGradient id={gl} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8400ff" />
          <stop offset="100%" stopColor="#5200a3" />
        </linearGradient>
        <linearGradient id={gd} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#8400ff" />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${gl})`} className="dark:hidden" />
      <path d={d} fill={`url(#${gd})`} className="hidden dark:block" />
      <path d={id} className="fill-white/30 dark:fill-zinc-950/35" />
      <circle cx={s * 0.72} cy={s * 0.28} r={s * 0.055} className="fill-primary-100 dark:fill-primary-300" />
    </motion.svg>
  );
}
