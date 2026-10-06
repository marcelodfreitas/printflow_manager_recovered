"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider } from "@/contexts/MobileNavContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-background)] text-[var(--app-foreground)]">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ThemeProvider>
      <MobileNavProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-background)] text-[var(--app-foreground)]">
          <div className="relative flex min-h-screen">
            {/* SIDEBAR */}
            <Sidebar />

            {/* CONTEÚDO */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* HEADER */}
              <Header />

              {/* MAIN */}
              <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1600px]">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </MobileNavProvider>
    </ThemeProvider>
  );
}