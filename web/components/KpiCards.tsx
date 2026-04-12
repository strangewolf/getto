"use client";

import { motion } from "motion/react";
import BorderGlow from "@/components/react-bits/BorderGlow/BorderGlow";

type Item = { label: string; value: string | number; hint?: string };

export function KpiCards({ items }: { items: Item[] }) {
  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {items.map((it) => (
        <motion.div
          key={it.label}
          variants={{
            hidden: { opacity: 0, y: 12, scale: 0.98 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
            },
          }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <BorderGlow
            borderRadius={18}
            glowRadius={26}
            backgroundColor="#0a0514"
            colors={["#8400ff", "#c084fc", "#22d3ee"]}
            className="p-0"
          >
            <div className="p-4">
              <div className="bits-type-body text-xs font-medium uppercase tracking-wide text-zinc-500">{it.label}</div>
              <div className="bits-type-display mt-1 text-2xl font-semibold text-zinc-50">{it.value}</div>
              {it.hint ? <div className="bits-type-body mt-1 text-xs text-zinc-500">{it.hint}</div> : null}
            </div>
          </BorderGlow>
        </motion.div>
      ))}
    </motion.div>
  );
}
