
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/supabase/auth";

export type Accent = "orange" | "green" | "blue" | "purple";
export type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  accent: Accent;
  animations: boolean;
  mode: ThemeMode;
  loading: boolean;

  setAccent: (accent: Accent) => Promise<void>;
  setAnimations: (enabled: boolean) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

const accentValues: Record<
  Accent,
  { hex: string; rgb: string }
> = {
  orange: { hex: "#fd6401", rgb: "253, 100, 1" },
  green: { hex: "#10b981", rgb: "16, 185, 129" },
  blue: { hex: "#3b82f6", rgb: "59, 130, 246" },
  purple: { hex: "#a855f7", rgb: "168, 85, 247" },
};

function applyAccent(accent: Accent) {
  const root = document.documentElement;
  const values = accentValues[accent];

  root.style.setProperty("--accent", values.hex);
  root.style.setProperty("--accent-rgb", values.rgb);
}

function applyAnimations(enabled: boolean) {
  document.documentElement.classList.toggle(
    "no-animations",
    !enabled,
  );
}

function applyMode(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const [accent, setAccentState] = useState<Accent>("orange");
  const [animations, setAnimationsState] = useState(true);
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      const userId = await getUserId();

      if (!userId) {
        applyAccent("orange");
        applyAnimations(true);
        applyMode("dark");
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("accent, animations, theme_mode")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar preferências:", error);

        applyAccent("orange");
        applyAnimations(true);
        applyMode("dark");
        return;
      }

      const savedAccent: Accent =
        data?.accent === "green" ||
        data?.accent === "blue" ||
        data?.accent === "purple"
          ? data.accent
          : "orange";

      const savedAnimations =
        typeof data?.animations === "boolean"
          ? data.animations
          : true;

      const savedMode: ThemeMode =
        data?.theme_mode === "light" ? "light" : "dark";

      setAccentState(savedAccent);
      setAnimationsState(savedAnimations);
      setModeState(savedMode);

      applyAccent(savedAccent);
      applyAnimations(savedAnimations);
      applyMode(savedMode);
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);

      applyAccent("orange");
      applyAnimations(true);
      applyMode("dark");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updateSetting = useCallback(
    async (
      field: "accent" | "animations" | "theme_mode",
      value: Accent | boolean | ThemeMode,
    ) => {
      try {
        const userId = await getUserId();

        if (!userId) return;

        const { error } = await supabase
          .from("user_settings")
          .update({ [field]: value })
          .eq("user_id", userId);

        if (error) {
          console.error(`Erro ao salvar ${field}:`, error);
        }
      } catch (error) {
        console.error(`Erro ao salvar ${field}:`, error);
      }
    },
    [supabase],
  );

  const setAccent = useCallback(
    async (value: Accent) => {
      setAccentState(value);
      applyAccent(value);
      await updateSetting("accent", value);
    },
    [updateSetting],
  );

  const setAnimations = useCallback(
    async (value: boolean) => {
      setAnimationsState(value);
      applyAnimations(value);
      await updateSetting("animations", value);
    },
    [updateSetting],
  );

  const setMode = useCallback(
    async (value: ThemeMode) => {
      setModeState(value);
      applyMode(value);
      await updateSetting("theme_mode", value);
    },
    [updateSetting],
  );

  return (
    <ThemeContext.Provider
      value={{
        accent,
        animations,
        mode,
        loading,
        setAccent,
        setAnimations,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme deve ser usado dentro de um ThemeProvider",
    );
  }

  return context;
}
