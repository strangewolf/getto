"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProductLogo } from "@/components/ProductLogo";
import { SplitTextTitle } from "@/components/SplitTextTitle";
import BorderGlow from "@/components/react-bits/BorderGlow/BorderGlow";

const SoftAurora = dynamic(() => import("@/components/react-bits/SoftAurora/SoftAurora"), {
  ssr: false,
});

type MockRole = "admin" | "user";

const MOCK_CREDS: Record<MockRole, { email: string; password: string; blurb: string }> = {
  admin: {
    email: "admin@getto.demo",
    password: "admin123",
    blurb: "Operations and fulfillment — full access.",
  },
  user: {
    email: "retailer@getto.demo",
    password: "retailer123",
    blurb: "Retailer view — orders and delivery status.",
  },
};

const transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

export default function LoginPage() {
  const { login, me, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [role, setRole] = useState<MockRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace("/dashboard");
  }, [loading, me, router]);

  function selectRole(r: MockRole) {
    const c = MOCK_CREDS[r];
    setRole(r);
    setEmail(c.email);
    setPassword(c.password);
    setStep("form");
    setErr(null);
  }

  function backToRoles() {
    setStep("pick");
    setRole(null);
    setEmail("");
    setPassword("");
    setErr(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email.trim(), password);
    } catch {
      setErr("Sign-in failed. Reset the demo state and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#060010] px-4 py-10 text-zinc-100"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <SoftAurora
          speed={0.62}
          scale={1.2}
          brightness={1.12}
          color1="#134e4a"
          color2="#5eead4"
          noiseFrequency={2.0}
          noiseAmplitude={1.15}
          bandSpread={1.05}
          bandHeight={0.42}
          enableMouseInteraction
          mouseInfluence={0.28}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#060010]/55 via-[#060010]/35 to-[#060010]/72" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <ProductLogo size={48} />
          <SplitTextTitle
            text="Smart Login Portal"
            className="bits-type-display text-balance text-3xl tracking-tight text-white sm:text-4xl"
            delayStart={0.08}
            stagger={0.1}
          />
          <p className="bits-type-body max-w-md text-sm leading-relaxed text-zinc-400">
            Mira-Bhayandar logistics POC for warehouse ops, retail orders, trips, and stock transfers. Choose a role
            to enter the app.
          </p>
        </div>

        <BorderGlow
          borderRadius={24}
          glowRadius={36}
          backgroundColor="#0a0514"
          colors={["#8400ff", "#c084fc", "#22d3ee"]}
          glowColor="132 0 255"
          className="p-6 sm:p-8"
          contentClassName="overflow-visible"
          animated={step === "form"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === "pick" ? (
              <motion.div
                key="pick"
                initial={{ opacity: 0, x: -28, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(3px)" }}
                transition={transition}
                className="space-y-5"
              >
                <div className="text-center">
                  <p className="bits-type-display inline-block border-b-2 border-primary-400/70 pb-1 text-sm font-semibold uppercase tracking-[0.28em] text-primary-100 drop-shadow-[0_0_24px_rgba(132,0,255,0.45)] sm:text-base">
                    Sign in as
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  {(
                    [
                      { id: "admin" as const, title: "Admin", sub: "Operations" },
                      { id: "user" as const, title: "User", sub: "Retailer" },
                    ] as const
                  ).map((opt) => (
                    <BorderGlow
                      key={opt.id}
                      borderRadius={18}
                      glowRadius={28}
                      backgroundColor="#12081f"
                      colors={["#8400ff", "#c084fc", "#38bdf8"]}
                      glowColor="132 0 255"
                      className="p-0"
                      contentClassName="overflow-visible"
                    >
                      <motion.button
                        type="button"
                        onClick={() => selectRole(opt.id)}
                        className="bits-type-body flex min-h-[7.5rem] w-full flex-col items-start justify-end gap-1 bg-transparent p-5 text-left outline-none"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="bits-type-display text-lg text-white">{opt.title}</span>
                        <span className="text-xs text-zinc-500">{opt.sub}</span>
                      </motion.button>
                    </BorderGlow>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 28, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(3px)" }}
                transition={transition}
                onSubmit={(e) => void onSubmit(e)}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={backToRoles}
                  className="bits-type-body text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
                >
                  ← Change role
                </button>
                <div>
                  <h2 className="bits-type-display text-xl text-white">
                    {role === "admin" ? "Admin sign-in" : "User sign-in"}
                  </h2>
                  <p className="bits-type-body mt-1 text-sm text-zinc-400">{role ? MOCK_CREDS[role].blurb : ""}</p>
                </div>

                <label className="bits-type-body block text-sm font-medium text-zinc-300">
                  Email
                  <input
                    type="email"
                    className="input-chamfer mt-2 border-zinc-600 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="bits-type-body block text-sm font-medium text-zinc-300">
                  Password
                  <input
                    type="password"
                    className="input-chamfer mt-2 border-zinc-600 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                {err ? (
                  <p className="bits-type-body text-sm text-red-400" role="alert">
                    {err}
                  </p>
                ) : null}

                <motion.button
                  type="submit"
                  disabled={busy}
                  className="bits-type-display w-full rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition-colors hover:bg-primary-500 disabled:opacity-50"
                  whileHover={{ scale: busy ? 1 : 1.02 }}
                  whileTap={{ scale: busy ? 1 : 0.98 }}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
