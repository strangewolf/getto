"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ProductLogo } from "@/components/ProductLogo";

const STORAGE_KEY = "slp-splash-seen";

export function InitialLoader({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "done">("loading");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase("done");
      return;
    }
    const minMs = 1200;
    const t = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setPhase("done");
    }, minMs);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {phase === "loading" ? (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <motion.div
              className="chamfer-card flex flex-col items-center gap-6 border border-zinc-200/80 bg-white/95 px-10 py-12 shadow-xl backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductLogo size={72} animated />
              <div className="text-center">
                <motion.p
                  className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                >
                  Smart Login Portal
                </motion.p>
                <motion.div
                  className="mt-3 flex justify-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary-500"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
