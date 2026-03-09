"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole((data?.role as UserRole | undefined) ?? null);
      setLoading(false);
    };

    run();
  }, []);

  return { role, loading };
}
