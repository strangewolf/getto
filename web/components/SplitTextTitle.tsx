"use client";

import { motion } from "motion/react";

type Props = {
  text: string;
  className?: string;
  /** Semantic heading level for accessibility */
  as?: "h1" | "h2";
  /** Delay before the first word animates (s) */
  delayStart?: number;
  /** Stagger between words (s) */
  stagger?: number;
};

/**
 * Word-by-word reveal (Split Text–style). Uses Motion instead of GSAP SplitText
 * (Club plugin — not shipped with public gsap).
 */
export function SplitTextTitle({
  text,
  className = "",
  as: Tag = "h1",
  delayStart = 0.12,
  stagger = 0.09,
}: Props) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden
        className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.35em] gap-y-1 [perspective:720px]"
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: 28, rotateX: -55, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.62,
              delay: delayStart + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: "50% 100%" }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}
