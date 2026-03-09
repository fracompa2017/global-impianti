import webpush from "web-push";

import type { PushPayload } from "@/types";

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@globalimpianti.it";

  if (!publicKey || !privateKey) {
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  payload: PushPayload
) {
  configureWebPush();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
