"use client";

import { useActionState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm rounded-2xl p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">
              LifeOS <span className="text-brand">Personal</span>
            </h1>
            <p className="text-xs text-zinc-400">Acesso privado</p>
          </div>
        </div>

        <form action={action} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-400">E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl bg-surface-950 border border-surface-700 px-3 py-2.5 text-sm text-white outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-400">Senha</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl bg-surface-950 border border-surface-700 px-3 py-2.5 text-sm text-white outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </label>

          {state?.error && (
            <p role="alert" className="text-sm text-rose-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-indigo-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none"
          >
            <Lock className="w-4 h-4" />
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
