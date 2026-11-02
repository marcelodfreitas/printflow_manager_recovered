
"use client";

import { useEffect, useState } from "react";
import { Building2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CompanyPage() {
  const { profile, updateProfile, uploadCompanyLogo } = useAuth();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    company_name: profile?.company_name ?? "",
    cnpj: profile?.cnpj ?? "",
    whatsapp: profile?.whatsapp ?? "",
    website: profile?.website ?? "",
    instagram: profile?.instagram ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    zip_code: profile?.zip_code ?? "",
  });

  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setForm({
      company_name: profile.company_name ?? "",
      cnpj: profile.cnpj ?? "",
      whatsapp: profile.whatsapp ?? "",
      website: profile.website ?? "",
      instagram: profile.instagram ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      zip_code: profile.zip_code ?? "",
    });
  }, [profile]);

  // Libera a URL temporária do preview ao desmontar o componente
  useEffect(() => {
    return () => {
      if (previewLogo) {
        URL.revokeObjectURL(previewLogo);
      }
    };
  }, [previewLogo]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm((prev) => ({ ...prev, zip_code: formatted }));

    const digits = formatted.replace(/\D/g, "");

    if (digits.length === 8) {
      setLoadingCep(true);

      try {
        const endereco = await buscarEnderecoPorCep(formatted);

        if (endereco) {
          setForm((prev) => ({
            ...prev,
            zip_code: formatted,
            address: endereco.address,
            city: endereco.city,
            state: endereco.state,
          }));
        }
      } catch {
        alert("Não foi possível consultar esse CEP.");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  async function handleCompanyLogoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    // Cria o preview imediatamente, antes do upload
    const previewUrl = URL.createObjectURL(file);

    setPreviewLogo(previewUrl);
    setUploadingLogo(true);

    try {
      const error = await uploadCompanyLogo(file);

      if (error) {
        setPreviewLogo(null);
        alert(error);
      }
    } catch {
      setPreviewLogo(null);
      alert("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      await updateProfile(form);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  function formatWhatsapp(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    const ddd = digits.slice(0, 2);
    const parte1 = digits.slice(2, 7);
    const parte2 = digits.slice(7, 11);

    if (digits.length <= 2) return ddd ? `(${ddd}` : "";
    if (digits.length <= 7) return `(${ddd})${parte1}`;

    return `(${ddd})${parte1}.${parte2}`;
  }

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 5) return digits;

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  async function buscarEnderecoPorCep(cep: string) {
    const digits = cep.replace(/\D/g, "");

    if (digits.length !== 8) return null;

    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

    if (!res.ok) {
      throw new Error("Erro ao consultar CEP");
    }

    const data = await res.json();

    if (data.erro) return null;

    return {
      address: data.logradouro,
      city: data.localidade,
      state: data.uf,
      neighborhood: data.bairro,
    };
  }

  return (
    <div className="company-page space-y-6 pt-8">
      <style jsx global>{`
        /* Textos */
        html[data-theme="light"] .company-page .text-white {
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .company-page [class*="text-white/"] {
          color: var(--muted) !important;
        }

        html[data-theme="light"] .company-page .text-green-400 {
          color: #059669 !important;
        }

        /* Cards */
        html[data-theme="light"] .company-page [class*="bg-white/"] {
          background-color: var(--surface) !important;
        }

        /* Bordas */
        html[data-theme="light"] .company-page [class*="border-white/"] {
          border-color: var(--border) !important;
        }

        /* Gradiente da área da logo */
        html[data-theme="light"] .company-page [class*="bg-gradient-to-br"] {
          background-image: linear-gradient(
            to bottom right,
            var(--surface-light),
            var(--surface)
          ) !important;
        }

        /* Campos de formulário */
        html[data-theme="light"] .company-page input,
        html[data-theme="light"] .company-page textarea,
        html[data-theme="light"] .company-page select {
          background-color: var(--surface-light) !important;
          border-color: var(--border) !important;
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .company-page input::placeholder {
          color: var(--muted) !important;
          opacity: 0.7;
        }

        /* Botão de alteração da logo */
        html[data-theme="light"] .company-page label[class*="border-white/"] {
          border-color: var(--border) !important;
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .company-page label[class*="border-white/"]:hover {
          background-color: var(--surface-light) !important;
        }

        /* Botão salvar */
        html[data-theme="light"] .company-page button.accent-bg {
          color: #ffffff !important;
        }

        html[data-theme="light"] .company-page button.accent-bg * {
          color: #ffffff !important;
        }
      `}</style>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* CARD LOGO */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col items-center text-center">
            {/* Preview da logo */}
            <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1a35] to-[#071124]">
              {previewLogo || profile?.company_logo_url ? (
                <img
                  src={previewLogo || profile?.company_logo_url || ""}
                  alt="Logo da empresa"
                  className={`h-full w-full object-contain p-4 transition-opacity duration-200 ${
                    uploadingLogo ? "opacity-50" : "opacity-100"
                  }`}
                />
              ) : (
                <Building2 className="h-16 w-16 text-white/20" />
              )}

              {/* Indicador de upload */}
              {uploadingLogo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  <span className="mt-2 text-xs font-medium text-white">
                    Enviando logo...
                  </span>
                </div>
              )}
            </div>

            <label
              className={`mt-6 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 transition ${
                uploadingLogo
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-white/5 hover:text-white"
              }`}
            >
              {uploadingLogo ? "Enviando..." : "Alterar logo"}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleCompanyLogoChange}
                disabled={uploadingLogo}
              />
            </label>

            <h2 className="mt-8 text-lg font-semibold text-white">
              {profile?.company_name || "Minha Empresa"}
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Identidade visual da empresa
            </p>

            {uploadingLogo && (
              <p className="mt-3 text-xs text-white/40">
                Aguarde enquanto sua logo é salva.
              </p>
            )}
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-6 text-lg font-semibold text-white">
            Informações da empresa
          </h3>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Nome da empresa
              </label>

              <Input
                value={form.company_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                CNPJ
              </label>

              <Input
                value={form.cnpj}
                placeholder="65.035.075/0001-00"
                onChange={(e) =>
                  setForm({
                    ...form,
                    cnpj: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                WhatsApp
              </label>

              <Input
                value={form.whatsapp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    whatsapp: formatWhatsapp(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Website
              </label>

              <Input
                value={form.website}
                onChange={(e) =>
                  setForm({
                    ...form,
                    website: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Instagram
              </label>

              <Input
                value={form.instagram}
                onChange={(e) =>
                  setForm({
                    ...form,
                    instagram: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                CEP
              </label>

              <Input
                value={form.zip_code}
                onChange={handleCepChange}
                placeholder="00000-000"
              />

              {loadingCep && (
                <span className="text-xs text-white/40">
                  Buscando endereço...
                </span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Endereço
              </label>

              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Cidade
              </label>

              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Estado
              </label>

              <Input
                value={form.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    state: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="
                inline-flex
                items-center
                m-auto
                justify-center
                rounded-xl
                accent-bg
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-all
                duration-200
                hover:bg-[var(--accent)]
                hover:shadow-lg
                hover:shadow-[var(--accent)]/20
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>

            {saved && (
              <div className="m-auto flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                Alterações salvas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
