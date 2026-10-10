"use client";

import { useMemo, useState } from "react";
import { Calculator, Clock3, Package, Printer, RotateCcw, Settings2, Coins, Weight } from "lucide-react";
import { useFilaments } from "@/hooks/useFilaments";
import { usePrinters } from "@/hooks/usePrinters";
import { formatCurrency } from "@/lib/utils";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#050914] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#FD6401]/60 focus:ring-2 focus:ring-[#FD6401]/10";
const labelClass = "text-xs font-medium text-white/55";

function Field({ label, value, onChange, suffix, min = 0, step = "any" }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; step?: number | string }) {
  return <label className="block"><span className={labelClass}>{label}</span><div className="relative"><input className={inputClass} type="number" min={min} step={step} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} />{suffix && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/30">{suffix}</span>}</div></label>;
}

export default function CalculosPage() {
  const { printers = [], loading: loadingPrinters } = usePrinters();
  const { filaments = [], loading: loadingFilaments } = useFilaments();
  const [printerId, setPrinterId] = useState("");
  const [filamentId, setFilamentId] = useState("");
  const [filamentPrice, setFilamentPrice] = useState(0);
  const [grams, setGrams] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [laborRate, setLaborRate] = useState(0);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [finishMinutes, setFinishMinutes] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [feePercent, setFeePercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [marginPercent, setMarginPercent] = useState(30);
  const [markupMultiplier, setMarkupMultiplier] = useState(3);
  const [advanced, setAdvanced] = useState(false);

  const selectedPrinter = printers.find((p) => p.id === printerId);
  const selectedFilament = filaments.find((f) => f.id === filamentId);
  const machineRate = Math.max(0, Number(selectedPrinter?.costPerHour) || 0);
  const totalMinutes = hours * 60 + minutes;
  const totalHours = totalMinutes / 60;
  const filamentCost = (Math.max(0, grams) / 1000) * Math.max(0, filamentPrice);
  const machineCost = totalHours * machineRate;
  const laborCost = ((prepMinutes + finishMinutes) / 60) * laborRate;
  const totalCost = filamentCost + machineCost + laborCost + packagingCost + extraCost;
  const combinedRate = (feePercent + taxPercent) / 100;
  const basePrice = combinedRate < 1 && marginPercent < 100 ? totalCost / (1 - marginPercent / 100 - combinedRate) : 0;
  const commercialPrice = basePrice * markupMultiplier;
  const netAfterFees = commercialPrice * (1 - combinedRate);
  const profit = netAfterFees - totalCost;
  const money = (v: number) => formatCurrency(Number.isFinite(v) ? v : 0);

  function reset() {
    // Limpa todos os campos, seleções e controles da calculadora.
    setPrinterId("");
    setFilamentId("");
    setFilamentPrice(0);
    setGrams(0);
    setHours(0);
    setMinutes(0);
    setLaborRate(0);
    setPrepMinutes(0);
    setFinishMinutes(0);
    setPackagingCost(0);
    setExtraCost(0);
    setFeePercent(0);
    setTaxPercent(0);
    setMarginPercent(0);
    setMarkupMultiplier(0);
    setAdvanced(false);
  }

  return <main className="relative min-h-screen overflow-hidden bg-[#050914] text-white">
    <div className="pointer-events-none fixed -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#071124]/70 blur-[130px]" />
    <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[#FD6401]/[0.06] blur-[140px]" />
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:32px_32px]" />
    <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FD6401]"><Calculator className="h-4 w-4" /> PrintFlow · Cálculos</div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Calculadora de impressão</h1><p className="mt-2 max-w-2xl text-sm text-white/45">Descubra seu custo real, encontre um preço competitivo e saiba quanto sobra no bolso.</p></div>
        <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Limpar valores</button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#0A1120]/85 p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/10"><Printer className="h-5 w-5 text-[#FD6401]" /></div><div><h2 className="text-sm font-semibold">Sua impressão</h2><p className="mt-0.5 text-xs text-white/35">Só precisa informar os dados básicos</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelClass}>Impressora</span><select className={inputClass} value={printerId} onChange={(e) => setPrinterId(e.target.value)}><option value="">{loadingPrinters ? "Carregando impressoras…" : "Selecione uma impressora"}</option>{printers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.model ? ` · ${p.model}` : ""}</option>)}</select><span className="mt-1.5 block text-[11px] text-white/30">Custo por hora configurado: {money(machineRate)}/h</span></label>
              <label className="block"><span className={labelClass}>Filamento cadastrado (opcional)</span><select className={inputClass} value={filamentId} onChange={(e) => { const id = e.target.value; setFilamentId(id); const f = filaments.find((item) => item.id === id); if (f) setFilamentPrice(Number(f.costPerKg) || 0); }}><option value="">Informar preço manualmente</option>{filaments.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
              <Field label="Preço do filamento por kg" value={filamentPrice} onChange={setFilamentPrice} suffix="R$/kg" step="0.01" />
              <Field label="Material utilizado" value={grams} onChange={setGrams} suffix="gramas" step="0.1" />
              <div className="sm:col-span-2"><span className={labelClass}>Tempo estimado de impressão</span><div className="mt-2 grid grid-cols-2 gap-3"><Field label="Horas" value={hours} onChange={setHours} suffix="h" step={1} /><Field label="Minutos" value={minutes} onChange={(v) => { setHours((old) => old + Math.floor(v / 60)); setMinutes(v % 60); }} suffix="min" step={1} /></div></div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 text-xs leading-relaxed text-white/40"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#FD6401]/80" /><p>O custo da impressora por hora deve incluir energia, manutenção e depreciação, conforme sua configuração em Impressoras.</p></div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1120]/85 p-5 shadow-xl shadow-black/20 sm:p-6">
            <button onClick={() => setAdvanced(!advanced)} className="flex w-full items-center justify-between gap-3 text-left"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"><Settings2 className="h-5 w-5 text-white/65" /></div><div><h2 className="text-sm font-semibold">Custos extras e precificação</h2><p className="mt-0.5 text-xs text-white/35">Mão de obra, embalagem, taxas e impostos</p></div></div><span className="text-xs font-medium text-[#FD6401]">{advanced ? "Recolher −" : "Personalizar +"}</span></button>
            {advanced && <div className="mt-5 grid gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2"><Field label="Valor da sua mão de obra por hora" value={laborRate} onChange={setLaborRate} suffix="R$/h" step="0.01" /><Field label="Preparação da impressão" value={prepMinutes} onChange={setPrepMinutes} suffix="min" step={1} /><Field label="Acabamento e remoção" value={finishMinutes} onChange={setFinishMinutes} suffix="min" step={1} /><Field label="Embalagem" value={packagingCost} onChange={setPackagingCost} suffix="R$" step="0.01" /><Field label="Outros custos" value={extraCost} onChange={setExtraCost} suffix="R$" step="0.01" /><Field label="Taxa do marketplace" value={feePercent} onChange={setFeePercent} suffix="%" step="0.1" /><Field label="Impostos estimados" value={taxPercent} onChange={setTaxPercent} suffix="%" step="0.1" /><div className="sm:col-span-2"><div className="mb-3 flex items-center justify-between"><span className={labelClass}>Margem de lucro desejada</span><span className="text-sm font-semibold text-[#FD6401]">{marginPercent}%</span></div><input aria-label="Margem de lucro desejada" type="range" min="0" max="70" step="5" value={marginPercent} onChange={(e) => setMarginPercent(Number(e.target.value))} className="w-full accent-[#FD6401]" /><div className="mt-1 flex justify-between text-[10px] text-white/30"><span>5% · Mais competitivo</span><span>70% · Maior margem</span></div></div></div>}
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border border-[#FD6401]/25 bg-[#0A1120]/95 shadow-2xl shadow-black/30"><div className="border-b border-white/[0.07] bg-gradient-to-br from-[#FD6401]/[0.13] to-transparent p-5 sm:p-6"><div className="flex items-center gap-2 text-xs font-medium text-[#FD6401]"><Coins className="h-4 w-4" /> Resultado em tempo real</div><p className="mt-4 text-xs text-white/45">Custo total estimado</p><p className="mt-1 text-3xl font-semibold tracking-tight">{money(totalCost)}</p><p className="mt-2 text-xs text-white/35">{totalMinutes} minutos de impressão · {grams} g de material</p></div>
            <div className="space-y-3 p-5 sm:p-6"><h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Composição do custo</h3>{[{label:"Filamento",value:filamentCost},{label:"Impressora",value:machineCost},{label:"Mão de obra",value:laborCost},{label:"Embalagem e extras",value:packagingCost+extraCost}].map((row) => <div key={row.label} className="flex items-center justify-between text-xs"><span className="text-white/45">{row.label}</span><span className="font-medium tabular-nums text-white/80">{money(row.value)}</span></div>)}<div className="my-4 border-t border-white/[0.08]"/><div className="flex items-center justify-between"><span className="text-sm font-medium">Preço base sugerido</span><span className="text-lg font-semibold">{money(basePrice)}</span></div><p className="text-[11px] leading-relaxed text-white/35">Calculado com margem de {marginPercent}%{combinedRate > 0 ? ` e taxas/impostos de ${feePercent + taxPercent}%` : ""}.</p></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A1120]/90 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-white/45">Multiplicador comercial</p><p className="mt-1 text-2xl font-semibold">{markupMultiplier.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}×</p></div><div className="rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/10 p-3"><Package className="h-5 w-5 text-[#FD6401]" /></div></div><input aria-label="Multiplicador comercial" type="range" min="0" max="10" step="0.5" value={markupMultiplier} onChange={(e) => setMarkupMultiplier(Number(e.target.value))} className="mt-5 w-full accent-[#FD6401]"/><div className="mt-1 flex justify-between text-[10px] text-white/30"><span>1×</span><span>5×</span><span>10×</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setMarkupMultiplier(3)} className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${markupMultiplier === 3 ? "border-[#FD6401]/50 bg-[#FD6401]/10 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>Atacado · 3×</button><button onClick={() => setMarkupMultiplier(5)} className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${markupMultiplier === 5 ? "border-[#FD6401]/50 bg-[#FD6401]/10 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>Varejo · 5×</button></div><div className="mt-5 rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/[0.06] p-4"><p className="text-xs text-white/45">Preço de venda sugerido</p><p className="mt-1 text-3xl font-semibold tracking-tight text-[#FD6401]">{money(commercialPrice)}</p><div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs"><span className="text-white/45">Lucro estimado após taxas</span><span className={`font-semibold ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{money(profit)}</span></div></div><p className="mt-3 text-[10px] leading-relaxed text-white/30">O multiplicador é uma referência comercial, não uma margem garantida. Confira as taxas e os impostos antes de definir o preço final.</p></div>
        </aside>
      </div>
      <p className="flex items-center justify-center gap-2 pb-3 text-center text-[11px] text-white/25"><Weight className="h-3.5 w-3.5" /> Estimativas baseadas nos valores informados e no custo/hora cadastrado.</p>
    </div>
  </main>;
}
