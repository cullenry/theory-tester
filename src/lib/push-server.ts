import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:hello@theoryprep.irish";

export const pushConfigured = (() => {
  if (!publicKey || !privateKey) return false;

  try {
    const publicKeyBytes = Buffer.from(publicKey, "base64url");
    const privateKeyBytes = Buffer.from(privateKey, "base64url");

    if (publicKeyBytes.length !== 65 || privateKeyBytes.length !== 32) {
      return false;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch {
    return false;
  }
})();

export async function sendTheoryPrepPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string },
) {
  if (!pushConfigured) throw new Error("VAPID push keys are not configured.");

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify({
      ...payload,
      icon: "/icons/theoryprep-bookOld.png",
      badge: "/icons/theoryprep-bookOld.png",
    }),
    {
      TTL: 60 * 60 * 24,
      urgency: "normal",
    },
  );
}
