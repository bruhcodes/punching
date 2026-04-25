function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return configured ? configured.replace(/\/+$/, "") : window.location.origin;
}

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /iPad|iPhone|iPod/.test(ua);
}

export function supportsWebPush(): boolean {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!supportsWebPush()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!supportsWebPush()) {
      return { ok: false, error: "This browser does not support web push notifications." };
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidKey) {
      return { ok: false, error: "The public push key is missing from the frontend build." };
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    const response = await fetch(buildApiUrl("/api/push/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription: sub.toJSON() }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text || "The app could not save your push subscription." };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Push setup failed.";
    return { ok: false, error: message };
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();

  await fetch(buildApiUrl("/api/push/subscribe"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function sendTestPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(buildApiUrl("/api/push/test"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text || "Test notification failed." };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test notification failed.";
    return { ok: false, error: message };
  }
}
