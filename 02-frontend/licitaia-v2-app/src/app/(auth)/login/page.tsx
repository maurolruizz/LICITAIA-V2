"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getLoginErrorMessage } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      await signIn({ tenantSlug, email, password });
      router.push("/dashboard");
    } catch (error: unknown) {
      setErrorMessage(getLoginErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">LICITAIA V2</h1>
        <p className="text-sm mb-6">Autenticação operacional</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Tenant slug"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
          />
          <input
            className="w-full rounded-xl border p-3"
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage ? (
            <div className="rounded-xl border p-3 text-sm">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border p-3 font-medium"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
