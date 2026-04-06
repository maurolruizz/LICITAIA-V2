"use client";

import { useAuthStore } from "@/store/auth.store";

type Props = {
  onLogout: () => void;
  logoutLoading?: boolean;
};

export function DashboardHeader({ onLogout, logoutLoading }: Props) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            LICITAIA V2
          </p>
          <h1 className="text-xl font-semibold text-neutral-900">Painel operacional</h1>
          {user ? (
            <p className="mt-1 text-sm text-neutral-600">
              <span className="font-medium text-neutral-800">{user.name}</span>
              {" · "}
              {user.email}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={logoutLoading}
          className="self-start rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:opacity-60"
        >
          {logoutLoading ? "Saindo…" : "Sair"}
        </button>
      </div>
    </header>
  );
}
