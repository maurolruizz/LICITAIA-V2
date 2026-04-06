"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useProcessStore } from "@/store/process.store";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProcessesPanel } from "@/components/dashboard/processes-panel";

export default function DashboardPage() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const loadProcesses = useProcessStore((s) => s.loadProcesses);
  const createProcess = useProcessStore((s) => s.createProcess);
  const items = useProcessStore((s) => s.items);
  const listLoading = useProcessStore((s) => s.listLoading);
  const listError = useProcessStore((s) => s.listError);
  const createLoading = useProcessStore((s) => s.createLoading);
  const createError = useProcessStore((s) => s.createError);

  useEffect(() => {
    void loadProcesses();
  }, [loadProcesses]);

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setLogoutBusy(false);
    }
  }

  async function handleNewProcess() {
    try {
      const id = await createProcess();
      router.push(`/process/${encodeURIComponent(id)}`);
    } catch {
      /* erro já em createError na store */
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader onLogout={handleLogout} logoutLoading={logoutBusy} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <ProcessesPanel
          items={items}
          listLoading={listLoading}
          listError={listError}
          createLoading={createLoading}
          createError={createError}
          onNewProcess={handleNewProcess}
        />
      </main>
    </div>
  );
}
