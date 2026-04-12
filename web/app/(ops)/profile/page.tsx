"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BorderGlow from "@/components/react-bits/BorderGlow/BorderGlow";
import { resetMockData } from "@/lib/mockApi";

export default function ProfilePage() {
  const { me, logout } = useAuth();
  const router = useRouter();

  if (!me) return null;

  const handleResetDemo = () => {
    if (!window.confirm("Reset demo data to the original seed state?")) return;
    resetMockData();
    router.refresh();
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Profile & account</h1>
        <p className="text-sm text-zinc-400">Demo session and local data controls.</p>
      </div>

      <div className="card-chamfer space-y-4 border border-zinc-800 bg-zinc-950/60 p-5">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-0.5 font-medium text-zinc-100">{me.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</dt>
            <dd className="mt-0.5 text-zinc-200">{me.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Roles</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {me.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                >
                  {r}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Organization</dt>
            <dd className="mt-0.5 text-zinc-200">{me.org_id}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleResetDemo}
          className="chamfer-control border border-zinc-600 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          Reset demo data
        </button>
        <BorderGlow borderRadius={12} glowRadius={18} backgroundColor="#12081f" colors={["#8400ff", "#c084fc", "#22d3ee"]} className="p-0">
          <button
            type="button"
            onClick={() => logout()}
            className="bits-type-body w-full px-5 py-2.5 text-sm font-semibold text-zinc-100 sm:w-auto"
          >
            Log out
          </button>
        </BorderGlow>
      </div>
    </div>
  );
}
