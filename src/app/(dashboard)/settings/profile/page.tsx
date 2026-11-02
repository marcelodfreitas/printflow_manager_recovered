"use client";

import { useEffect, useState } from "react";
import { Camera, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";


export default function ProfilePage() {
  const { 
  profile,
  updateProfile,
  uploadAvatar,
  uploadCompanyLogo
} = useAuth();

  const [saved, setSaved] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    company_name: profile?.company_name ?? "",
    phone: profile?.phone ?? "",
    whatsapp:profile?.whatsapp ?? "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        company_name: profile.company_name ?? "",
        phone: profile.phone ?? "",
        whatsapp:profile?.whatsapp ?? "",
      });
    }
  }, [profile]);

  const [saving, setSaving] = useState(false);

async function handleCompanyLogoChange(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  const error = await uploadCompanyLogo(file);

  if (error) {
    alert(error);
  }
}

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const error = await uploadAvatar(file);

    if (error) {
      alert(error);
    }

    setUploading(false);
  }

  async function handleSave() {
  setSaving(true);

  await updateProfile(form);

  setSaving(false);

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 3000);
}

function formatWhatsapp(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11); // só números, máx 11 dígitos (DDD + 9 dígitos)

    const ddd = digits.slice(0, 2);
    const parte1 = digits.slice(2, 7);
    const parte2 = digits.slice(7, 11);

    if (digits.length <= 2) return ddd ? `(${ddd}` : "";
    if (digits.length <= 7) return `(${ddd})${parte1}`;
    return `(${ddd})${parte1}.${parte2}`;
  }

  return (
  <>
        <div className="profile-page mx-auto max-w-4xl space-y-6 p-6 pt-8">
          <style jsx global>{`
  /* Textos */
  html[data-theme="light"] .profile-page .text-white {
    color: var(--app-foreground) !important;
  }

  html[data-theme="light"] .profile-page [class*="text-white/"] {
    color: var(--muted) !important;
  }

  html[data-theme="light"] .profile-page .text-green-400 {
    color: #059669 !important;
  }

  /* Cards */
  html[data-theme="light"] .profile-page [class*="bg-white/"] {
    background-color: var(--surface) !important;
  }

  /* Bordas */
  html[data-theme="light"] .profile-page [class*="border-white/"] {
    border-color: var(--border) !important;
  }

  /* Fundo do avatar */
  html[data-theme="light"] .profile-page [class*="bg-gradient-to-br"] {
    background-image: linear-gradient(
      to bottom right,
      var(--surface-light),
      var(--surface)
    ) !important;
  }

  /* Campos */
  html[data-theme="light"] .profile-page input,
  html[data-theme="light"] .profile-page textarea,
  html[data-theme="light"] .profile-page select {
    background-color: var(--surface-light) !important;
    border-color: var(--border) !important;
    color: var(--app-foreground) !important;
  }

  html[data-theme="light"] .profile-page input::placeholder {
    color: var(--muted) !important;
    opacity: 0.7;
  }

  /* Botão de alterar avatar */
  html[data-theme="light"] .profile-page label.accent-bg {
    color: #ffffff !important;
  }

  html[data-theme="light"] .profile-page label.accent-bg svg {
    color: #ffffff !important;
  }

  /* Botão salvar */
  html[data-theme="light"] .profile-page button.accent-bg {
    color: #ffffff !important;
  }

  html[data-theme="light"] .profile-page button.accent-bg * {
    color: #ffffff !important;
  }
`}</style>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* CARD AVATAR */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col items-center text-center">
            {/* AVATAR */}
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#0d1a35] to-[#071124] text-4xl font-bold accent-text">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="h-full w-full object-cover"
                    alt="Avatar"
                  />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase()
                )}
              </div>

              <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full accent-bg text-white shadow-lg transition hover:scale-105">
                <Camera className="h-5 w-5" />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            
            <h2 className="mt-5 text-lg font-semibold text-white">
              {profile?.company_name}
            </h2>

            <p className="text-sm text-white/40">{profile?.full_name}</p>
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">
            Informações
          </h3>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Nome
              </label>

              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Empresa
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
                Telefone
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

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto m-auto rounded-xl accent-bg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:accent-bg hover:shadow-lg hover:shadow-[var(--accent)]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>

            {saved && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                Alterações salvas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}
