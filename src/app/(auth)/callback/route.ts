import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=google_auth", requestUrl.origin),
    );
  }

  const supabase = createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("ERRO CALLBACK GOOGLE:", error);

    return NextResponse.redirect(
      new URL("/login?error=google_auth", requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL(next.startsWith("/") ? next : "/", requestUrl.origin),
  );
}
