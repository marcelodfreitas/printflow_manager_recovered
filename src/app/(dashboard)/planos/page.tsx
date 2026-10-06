"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Crown,
  Rocket,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "PrintFlow Starter",
    description: "Para quem está começando na impressão 3D.",
    price: "R$ 0,00",
    period: "/mês",
    icon: Rocket,
    button: "Começar grátis",
    featured: false,
    featuresTitle: "Para começar sua operação:",
    features: [
      "1 impressora",
      "Até 5 filamentos",
      "Até 20 clientes",
      "Até 10 pedidos por mês",
      "Cálculos básicos",
      "Catálogo de produtos",
      "Controle básico de estoque",
      "Dashboard",
      "Controle de perdas",
    ],
  },
  {
    id: "maker",
    name: "PrintFlow Maker",
    description: "Para quem já imprime e vende por conta própria.",
    price: "R$ 19,90",
    period: "/mês",
    icon: Wrench,
    button: "Escolher Maker",
    featured: false,
    featuresTitle: "Tudo do Starter, e mais:",
    features: [
      "Até 3 impressoras",
      "Até 30 filamentos",
      "Clientes ilimitados",
      "Pedidos ilimitados",
      "Orçamentos",
      "Cálculo completo de custos",
      "Custo por hora das impressoras",
      "Estoque de filamentos",
      "Histórico de produção",
    ],
  },
  {
    id: "pro",
    name: "PrintFlow Pro",
    description: "Tudo o que você precisa para profissionalizar sua operação.",
    price: "R$ 39,90",
    period: "/mês",
    icon: Crown,
    button: "Assinar Pro",
    featured: true,
    badge: "MAIS POPULAR",
    featuresTitle: "Tudo do Maker, e mais:",
    features: [
      "Impressoras ilimitadas",
      "Filamentos ilimitados",
      "Cálculos avançados",
      "Orçamentos profissionais",
      "Gestão completa de pedidos",
      "Estoque completo",
      "Relatórios avançados",
      "Análise de rentabilidade",
      "Indicadores financeiros",
      "Dashboard avançado",
      "Recursos exclusivos do Pro",
    ],
  },
];

export default function PlanosPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#FD6401]/10 blur-[150px]" />

        <div className="absolute bottom-[-260px] left-[-180px] h-[460px] w-[460px] rounded-full bg-[#071124]/90 blur-[130px]" />

        <div className="absolute right-[-180px] top-[30%] h-[460px] w-[460px] rounded-full bg-[#FD6401]/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <Link
            href="/dashboard"
            className="mb-7 inline-flex items-center transition-opacity hover:opacity-80"
          >
            <div className="flex items-center">
              <span className="text-3xl font-black tracking-[-0.07em] text-white">
                PRINT
              </span>

              <span className="text-3xl font-black tracking-[-0.07em] text-[#FD6401]">
                FLOW
              </span>
            </div>
          </Link>

          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[#FD6401]/20 bg-[#FD6401]/10 px-3.5 py-1.5 text-xs font-semibold text-[#FD6401]">
            Planos PrintFlow
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[42px]">
            Leve sua operação 3D para o próximo nível
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Comece grátis e evolua quando sua operação começar a crescer.
          </p>
        </header>

        {/* Plans */}
        <section className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                  plan.featured
                    ? "border-[#FD6401]/60 bg-[#0A1120]/95 shadow-[0_0_60px_rgba(253,100,1,0.13)] lg:-mt-3 lg:mb-[-12px]"
                    : "border-white/10 bg-[#0A1120]/80 hover:border-white/20"
                }`}
              >
                {/* Pro top glow */}
                {plan.featured && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FD6401]/10 to-transparent" />
                )}

                {/* Popular badge */}
                {plan.featured && (
                  <div className="relative flex justify-center">
                    <div className="rounded-b-xl bg-[#FD6401] px-5 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white shadow-[0_4px_20px_rgba(253,100,1,0.25)]">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div
                  className={`relative flex flex-1 flex-col p-6 sm:p-7 ${
                    plan.featured ? "pt-6" : "pt-7"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${
                      plan.featured
                        ? "border-[#FD6401]/30 bg-[#FD6401]/10 text-[#FD6401] shadow-[0_0_25px_rgba(253,100,1,0.10)]"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Name */}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {plan.name}
                    </h2>

                    <p className="mt-2 min-h-[42px] text-sm leading-5 text-slate-400">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-6">
                    <div className="flex min-h-[50px] items-end gap-1">
                      <span
                        className={`text-3xl font-bold tracking-tight sm:text-[34px] ${
                          plan.featured ? "text-[#FD6401]" : "text-white"
                        }`}
                      >
                        {plan.price}
                      </span>

                      {plan.period && (
                        <span className="mb-1.5 text-xs text-slate-500">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    {/* Pro value anchor */}
                    {plan.id === "pro" && (
                      <p className="mt-1 text-xs font-medium text-emerald-400">
                        Apenas R$ 20 a mais que o Maker
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all ${
                      plan.featured
                        ? "border-[#FD6401] bg-[#FD6401] text-white shadow-[0_0_28px_rgba(253,100,1,0.22)] hover:bg-[#e95a00] hover:shadow-[0_0_34px_rgba(253,100,1,0.30)]"
                        : "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    {plan.featured && <Zap className="h-4 w-4" />}
                    {plan.button}
                  </button>

                  {/* Cancel message for Pro */}
                  {plan.featured && (
                    <p className="mt-2 text-center text-[11px] text-slate-500">
                      Cancele quando quiser
                    </p>
                  )}

                  {/* Divider */}
                  <div className="my-6 h-px bg-white/[0.08]" />

                  {/* Features title */}
                  <div className="mb-4">
                    <p
                      className={`text-xs font-semibold ${
                        plan.featured ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {plan.featuresTitle}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-2.5 text-sm leading-5 ${
                          plan.featured && index < 3
                            ? "font-medium text-slate-200"
                            : "text-slate-300"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            plan.featured
                              ? "bg-emerald-500/10"
                              : "bg-emerald-500/10"
                          }`}
                        >
                          <Check className="h-3 w-3 text-emerald-400" />
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Pro bottom highlight */}
                  {plan.featured && (
                    <div className="mt-6 rounded-xl border border-[#FD6401]/15 bg-[#FD6401]/[0.05] px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-[#FD6401]/10 p-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#FD6401]" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">
                            O plano completo
                          </p>

                          <p className="mt-1 text-[11px] leading-4 text-slate-400">
                            Tenha todas as ferramentas para controlar,
                            calcular e acompanhar sua operação.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Comparison message */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-sm text-slate-500">
            Comece gratuitamente. Quando sua operação crescer, o PrintFlow
            cresce com você.
          </p>
        </div>

        {/* Back */}
        <div className="mt-7 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}