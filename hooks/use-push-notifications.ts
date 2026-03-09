"use client";

import { useCallback, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function usePushNotifications() {
  const vapidPublicKey = useMemo(
    () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    []
  );

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !vapidPublicKey) {
      throw new Error("Push notifications non supportate in questo browser");
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Utente non autenticato");
    }

    await supabase
      .from("profiles")
      .update({ push_subscription: subscription.toJSON() })
      .eq("id", user.id);

    return subscription;
  }, [vapidPublicKey]);

  return { subscribe };
}
