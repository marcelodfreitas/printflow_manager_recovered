
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RGE_TARIFF = {
  distributor: "RGE / CPFL",
  energyRate: 0.94461,
  tusd: 0.5885,
  te: 0.35611,
  source: "ANEEL - Resolução Homologatória nº 3.590/2026",
  reference:
    "https://www.cpfl.com.br/tarifa-cpfl-rge-2026",
  updatedAt: "2026-06-19",
  validUntil: "2027-06-18",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const cep = (
    request.nextUrl.searchParams.get("cep") ?? ""
  ).replace(/\D/g, "");

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { error: "Informe um CEP válido com 8 dígitos." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CEP." },
        { status: 502 },
      );
    }

    const address = await response.json();

    if (address.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado." },
        { status: 404 },
      );
    }

    const city = address.localidade ?? "";
    const state = address.uf ?? "";

    // Correspondência confirmada para Canoas/RS.
    // Não presumir a distribuidora de outros municípios.
    const isCanoasRGE =
      normalize(city) === "canoas" && state === "RS";

    if (isCanoasRGE) {
      return NextResponse.json({
        cep: address.cep,
        city,
        state,
        ibge: address.ibge ?? null,
        distributor: RGE_TARIFF.distributor,
        energyRate: RGE_TARIFF.energyRate,
        tusd: RGE_TARIFF.tusd,
        te: RGE_TARIFF.te,
        energyRateSource: "automatic",
        source: RGE_TARIFF.source,
        reference: RGE_TARIFF.reference,
        updatedAt: RGE_TARIFF.updatedAt,
        validUntil: RGE_TARIFF.validUntil,
        includesTaxes: false,
        message:
          "Tarifa residencial de referência localizada para Canoas/RS. Não inclui impostos nem bandeira tarifária.",
      });
    }

    return NextResponse.json({
      cep: address.cep,
      city,
      state,
      ibge: address.ibge ?? null,
      distributor: null,
      energyRate: null,
      energyRateSource: null,
      source: "ViaCEP",
      message:
        "CEP localizado, mas ainda não temos uma correspondência automática de distribuidora e tarifa para este município.",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Falha ao consultar o serviço de CEP. Tente novamente.",
      },
      { status: 502 },
    );
  }
}
