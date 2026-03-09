"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/auth/login");
    };

    run();
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <p className="text-sm text-muted-foreground">Disconnessione in corso...</p>
    </main>
  );
}
