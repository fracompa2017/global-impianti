import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

const ADMIN_HOME = "/admin/dashboard";
const DIPENDENTE_HOME = "/dipendente/home";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isRootRoute = pathname === "/";
  const isAuthRoute = pathname.startsWith("/auth");
  const isLoginRoute = pathname === "/auth/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isDipendenteRoute = pathname.startsWith("/dipendente");
  const hasPwaCookie = request.cookies.get("pwa-installed")?.value === "true";

  if (isRootRoute && hasPwaCookie) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!user && isLoginRoute && !hasPwaCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && (isAdminRoute || isDipendenteRoute)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (isAuthRoute && profile?.role === "admin") {
      return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
    }

    if (isAuthRoute && profile?.role === "dipendente") {
      return NextResponse.redirect(new URL(DIPENDENTE_HOME, request.url));
    }

    if (isAdminRoute && profile?.role !== "admin") {
      return NextResponse.redirect(new URL(DIPENDENTE_HOME, request.url));
    }

    if (isDipendenteRoute && profile?.role !== "dipendente") {
      return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
    }
  }

  return supabaseResponse;
}
