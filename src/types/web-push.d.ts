declare module "web-push" {
  type PushSubscription = {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  type SendNotificationOptions = {
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
  };

  type WebPush = {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(
      subscription: PushSubscription,
      payload?: string | Buffer,
      options?: SendNotificationOptions,
    ): Promise<unknown>;
  };

  const webpush: WebPush;
  export default webpush;
}
