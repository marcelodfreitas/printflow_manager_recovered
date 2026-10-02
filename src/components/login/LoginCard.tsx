"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export function LoginCard() {
  const router = useRouter();
  const { login, register } = useAuth();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const errorMsg =
      mode === "login"
        ? await login(email, password)
        : await register(name, email, password);

    if (errorMsg) {
      setError(errorMsg);
    } else {
      router.push("/");
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/callback`,
  },
});

    if (error) {
      console.error("ERRO GOOGLE LOGIN:", error);
      setError("Não foi possível entrar com o Google. Tente novamente.");
      setGoogleLoading(false);
    }
  }

  function selectMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="login-card w-full max-w-[430px] rounded-[15px] border border-white/15 bg-white/[.08] p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl">
      <div className="relative overflow-hidden rounded-[15px] border border-white/10 bg-[#080d16]/96 p-6 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex w-full flex-col items-center gap-5">
          <div className="w-full">
            <h2 className="text-center text-2xl font-semibold tracking-normal text-white">
              {mode === "login" ? "Acesse o PrintFlow" : "Comece no PrintFlow"}
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-400">
              {mode === "login"
                ? "Acompanhe pedidos, produção em tempo real."
                : "Organize a operação desde o primeiro pedido."}
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 rounded-[8px] border border-white/10 bg-white/[.045] p-1">
            <ModeButton
              active={mode === "login"}
              onClick={() => selectMode("login")}
            >
              Login
            </ModeButton>

            <ModeButton
              active={mode === "register"}
              onClick={() => selectMode("register")}
            >
              Cadastro
            </ModeButton>
          </div>
        </div>

        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-[8px] border border-white/15 bg-white/[.055] px-5 text-sm font-semibold text-white transition duration-300 hover:border-white/25 hover:bg-white/[.09] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Conectando...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continuar com Google
                </>
              )}
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                ou
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {mode === "register" && (
            <LoginField
              id="name"
              label="Nome"
              icon={User}
              value={name}
              placeholder="Seu nome"
              onChange={setName}
              animationDelay="60ms"
            />
          )}

          <LoginField
            id="email"
            label="Email"
            icon={Mail}
            type="email"
            value={email}
            placeholder="seu@email.com"
            onChange={setEmail}
            animationDelay={mode === "register" ? "120ms" : "60ms"}
          />

          <LoginField
            id="password"
            label="Senha"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Digite sua senha"
            onChange={setPassword}
            animationDelay={mode === "register" ? "180ms" : "120ms"}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-white/35 transition hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          {error && (
            <div className="rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="login-shine group h-12 w-full overflow-hidden rounded-[8px] border border-[#ffb06c]/35 bg-[linear-gradient(110deg,#fd6401,#ff9f1a,#fd6401)] bg-[length:200%_100%] px-5 font-semibold text-[#170b02] shadow-xl shadow-[#fd6401]/25 transition duration-300 hover:scale-[1.03] hover:shadow-[#fd6401]/40 focus:ring-[#fd6401]/35 focus:ring-offset-[#080d16] disabled:scale-100"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#170b02]/25 border-t-[#170b02]" />
                Aguarde...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">
            {mode === "login" ? "Não tem conta?" : "Já possui conta?"}
          </span>

          <button
            type="button"
            onClick={() => selectMode(mode === "login" ? "register" : "login")}
            className="font-semibold text-white transition hover:accent-text"
          >
            {mode === "login" ? "Criar acesso" : "Fazer login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.45l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.88a6.01 6.01 0 0 1 0-3.76V7.54H3.06a10 10 0 0 0 0 8.92l3.34-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 2.93 14.7 2 12 2a10 10 0 0 0-8.94 5.54L6.4 10.12C7.2 7.76 9.4 6 12 6Z"
      />
    </svg>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-[#071124] shadow-lg shadow-black/20"
          : "text-white/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LoginField({
  id,
  label,
  icon: Icon,
  value,
  placeholder,
  onChange,
  type = "text",
  action,
  animationDelay,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
  action?: React.ReactNode;
  animationDelay: string;
}) {
  return (
    <label className="login-input block" style={{ animationDelay }}>
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className="block h-12 w-full rounded-[8px] border border-white/10 bg-white/[.055] px-4 pl-12 pr-12 text-sm text-white shadow-inner shadow-black/10 outline-none transition placeholder:text-white/28 focus:border-[#fd6401]/60 focus:bg-white/[.08] focus:ring-4 focus:ring-[#fd6401]/10"
        />

        {action}
      </span>
    </label>
  );
}