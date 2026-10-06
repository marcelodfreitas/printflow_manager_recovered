import Image from "next/image";
import logo from "@/assets/logo.png";
import {
  Boxes,
  CheckCircle2,
  Printer,
  ShoppingCart,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex w-full flex-col justify-center py-8 lg:py-10">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#fd6401]/[0.07] blur-[110px]" />

      {/* Brand */}
      <div className="login-rise relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] border border-white/10 bg-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <Image
            src={logo}
            alt="PrintFlow"
            width={60}
            height={60}
            className="rounded-full object-contain"
            priority
          />
        </div>

        <div>
          <p className="text-lg font-semibold leading-tight tracking-tight text-white">
            PrintFlow
          </p>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
            MANAGER 3D
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="login-rise relative z-10 mt-12 max-w-[570px]">
        

        <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl xl:text-[52px]">
          Sua produção 3D.
          <br />
          <span className="text-white/45">Sob controle.</span>
        </h1>

        <p className="mt-6 max-w-[500px] text-base leading-7 text-slate-300 sm:text-[17px]">
          Pedidos, clientes, impressoras, custos e orçamentos em um único
          lugar, pensado para quem vive de impressão 3D.
        </p>
      </div>

      {/* Benefits */}
      <div className="login-rise relative z-10 mt-8 flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-xs text-white/55">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#fd6401]" />
          Produção organizada
        </div>

        <div className="flex items-center gap-2 text-xs text-white/55">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#fd6401]" />
          Custos sob controle
        </div>

        <div className="flex items-center gap-2 text-xs text-white/55">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#fd6401]" />
          Gestão em um só lugar
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="login-rise relative z-10 mt-10 max-w-[590px]">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#fd6401]/10 blur-[70px]" />

          <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#080d16]/95">
            {/* Preview header */}
            <div className="flex h-10 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-[#fd6401]/15 p-1">
                  <Boxes className="h-full w-full text-[#fd6401]" />
                </div>

                <span className="text-[10px] font-medium text-white/60">
                  Visão geral
                </span>
              </div>

              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 p-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-3.5 w-3.5 text-white/35" />

                  <span className="text-[8px] font-medium text-emerald-400/80">
                    +12%
                  </span>
                </div>

                <p className="mt-3 text-[9px] text-white/35">
                  Pedidos ativos
                </p>

                <p className="mt-0.5 text-lg font-semibold text-white">
                  24
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between">
                  <Printer className="h-3.5 w-3.5 text-white/35" />

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                </div>

                <p className="mt-3 text-[9px] text-white/35">
                  Impressoras
                </p>

                <p className="mt-0.5 text-lg font-semibold text-white">
                  08
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between">
                  <Boxes className="h-3.5 w-3.5 text-white/35" />

                  <span className="text-[8px] font-medium text-[#fd6401]/80">
                    82%
                  </span>
                </div>

                <p className="mt-3 text-[9px] text-white/35">
                  Filamentos
                </p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[82%] rounded-full bg-[#fd6401]" />
                </div>
              </div>
            </div>

            {/* Production */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-white/[0.07] px-4 py-3">
              <div>
                <p className="text-[9px] font-medium text-white/55">
                  Produção em andamento
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full w-[68%] rounded-full bg-[#fd6401]" />
                  </div>

                  <span className="text-[8px] text-white/30">
                    68%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[8px] text-white/35">
                  Sistema operacional
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-7 text-xs text-white/30">
        Desenvolvido para makers, estúdios e empresas de impressão 3D.
      </p>
    </section>
  );
}