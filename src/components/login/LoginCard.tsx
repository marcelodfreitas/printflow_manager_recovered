"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginCard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (authError) {
      console.error("Erro no login com Google:", authError);
      setError(authError.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-card w-full max-w-[430px] rounded-[15px] border border-white/15 bg-white/[.08] p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl">
      <div className="relative overflow-hidden rounded-[15px] border border-white/10 bg-[#080d16]/96 p-6 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative flex w-full flex-col items-center">
          <div className="w-full">
            <h2 className="text-center text-2xl font-semibold tracking-normal text-white">
              Acesse o PrintFlow
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-400">
              Acompanhe pedidos, produção em tempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-[8px] border border-white/10 bg-white px-5 text-sm font-semibold text-[#071124] shadow-xl shadow-black/20 transition hover:scale-[1.02] hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#071124]/20 border-t-[#071124]" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 21.67c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.51A9.74 9.74 0 0 0 12 21.67Z"
                  fill="#34A853"
                />
                <path
                  d="M6.53 13.78a5.86 5.86 0 0 1 0-3.56V7.71H3.28a9.73 9.73 0 0 0 0 8.58l3.25 2.51Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 6.19c1.43 0 2.72.49 3.74 1.45l2.8-2.8C16.84 3.3 14.63 2.33 12 2.33a9.74 9.74 0 0 0-8.72 5.38l3.25 2.51C7.3 7.91 9.46 6.19 12 6.19Z"
                  fill="#EA4335"
                />
              </svg>
            )}

            {loading ? "Conectando..." : "Continuar com Google"}
          </button>

          {error && (
            <div className="mt-4 w-full rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Ao continuar, você concorda com os termos de uso do PrintFlow.
          </p>
        </div>
      </div>
    </div>
  );
}