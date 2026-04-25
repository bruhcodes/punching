import { randomUUID } from "crypto";

type SupabaseUserRow = {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  punch_count: number;
  total_punches: number;
  qr_code: string;
  created_at: string;
};

type SupabaseSettingsRow = {
  id: string;
  stamp_type: string;
  background_style: string;
  card_style: string | null;
  progress_style: string;
  shop_name: string;
  background_image_url: string | null;
  accent_color: string | null;
  welcome_message: string | null;
  hero_badge: string | null;
  reward_label: string | null;
  deal_label: string | null;
};

type SupabaseNotificationRow = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
};

type SupabasePushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  prefer?: string;
};

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL must be set.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set.");
}

const restBaseUrl = `${supabaseUrl}/rest/v1`;
const supabaseApiKey = serviceRoleKey;

function buildHeaders(prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: supabaseApiKey,
    Authorization: `Bearer ${supabaseApiKey}`,
    "Content-Type": "application/json",
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${restBaseUrl}/${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.prefer),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toInFilter(values: string[]): string {
  return `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;
}

function mapUser(row: SupabaseUserRow) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    punchCount: row.punch_count,
    totalPunches: row.total_punches,
    qrCode: row.qr_code,
    createdAt: row.created_at,
  };
}

function mapSettings(row: SupabaseSettingsRow) {
  return {
    id: row.id,
    stampType: row.stamp_type,
    backgroundStyle: row.background_style,
    progressStyle: row.progress_style,
    shopName: row.shop_name,
    backgroundImageUrl: row.background_image_url,
    accentColor: row.accent_color,
    welcomeMessage: row.welcome_message,
    heroBadge: row.hero_badge,
    rewardLabel: row.reward_label,
    dealLabel: row.deal_label,
    cardStyle: row.card_style,
  };
}

function mapNotification(row: SupabaseNotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
};

function mapPushSubscription(row: SupabasePushSubscriptionRow): PushSubscriptionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    createdAt: row.created_at,
  };
}

export async function listUsers(search?: string) {
  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
  });

  if (search) {
    const normalized = search.replace(/[%*,]/g, " ").trim();
    params.set("or", `(name.ilike.*${normalized}*,phone.ilike.*${normalized}*)`);
  }

  const rows = await request<SupabaseUserRow[]>(`users?${params.toString()}`);
  return rows.map(mapUser);
}

export async function findUserByPhone(phone: string) {
  const params = new URLSearchParams({
    select: "*",
    phone: `eq.${phone}`,
    limit: "1",
  });

  const rows = await request<SupabaseUserRow[]>(`users?${params.toString()}`);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUserRecord(name: string, phone: string, avatarUrl?: string) {
  const id = randomUUID();
  const rows = await request<SupabaseUserRow[]>("users", {
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        id,
        name,
        phone,
        avatar_url: avatarUrl ?? null,
        qr_code: id,
        punch_count: 0,
        total_punches: 10,
      },
    ],
  });

  return mapUser(rows[0]);
}

export async function getUserById(id: string) {
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });

  const rows = await request<SupabaseUserRow[]>(`users?${params.toString()}`);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function updateUserPunchCount(id: string, nextPunchCount: number) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
  });

  const rows = await request<SupabaseUserRow[]>(`users?${params.toString()}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: { punch_count: nextPunchCount },
  });

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function updateUserRecord(
  id: string,
  data: { name?: string; phone?: string; avatarUrl?: string | null; totalPunches?: number },
) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
  });

  const rows = await request<SupabaseUserRow[]>(`users?${params.toString()}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl || null } : {}),
      ...(data.totalPunches !== undefined ? { total_punches: data.totalPunches } : {}),
    },
  });

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function deleteUserRecord(id: string) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
  });

  await request<void>(`users?${params.toString()}`, {
    method: "DELETE",
  });
}

export async function getOrCreateSettings() {
  const params = new URLSearchParams({
    select: "*",
    id: "eq.default",
    limit: "1",
  });

  const rows = await request<SupabaseSettingsRow[]>(`settings?${params.toString()}`);
  if (rows[0]) {
    return mapSettings(rows[0]);
  }

  const created = await request<SupabaseSettingsRow[]>("settings", {
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        id: "default",
        stamp_type: "star",
        background_style: "white",
        card_style: "luxe",
        progress_style: "stamps",
        shop_name: "Punch Card",
        background_image_url: null,
        accent_color: "#111827",
        welcome_message: "Tap your QR code in-store to collect punches.",
        hero_badge: "Member status",
        reward_label: "Free drink",
        deal_label: "Deal bar",
      },
    ],
  });

  return mapSettings(created[0]);
}

export async function updateSettingsRecord(data: {
  stampType?: string;
  backgroundStyle?: string;
  progressStyle?: string;
  shopName?: string;
  backgroundImageUrl?: string;
  accentColor?: string;
  welcomeMessage?: string;
}) {
  await getOrCreateSettings();

  const params = new URLSearchParams({
    id: "eq.default",
    select: "*",
  });

  const rows = await request<SupabaseSettingsRow[]>(`settings?${params.toString()}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: {
      ...(data.stampType ? { stamp_type: data.stampType } : {}),
      ...(data.backgroundStyle ? { background_style: data.backgroundStyle } : {}),
      ...(data.progressStyle ? { progress_style: data.progressStyle } : {}),
      ...(data.shopName ? { shop_name: data.shopName } : {}),
      ...(data.backgroundImageUrl !== undefined ? { background_image_url: data.backgroundImageUrl || null } : {}),
      ...(data.accentColor !== undefined ? { accent_color: data.accentColor || null } : {}),
      ...(data.welcomeMessage !== undefined ? { welcome_message: data.welcomeMessage || null } : {}),
    },
  });

  return mapSettings(rows[0]);
}

export async function listNotificationsByUser(userId: string) {
  const params = new URLSearchParams({
    select: "*",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
  });

  const rows = await request<SupabaseNotificationRow[]>(`notifications?${params.toString()}`);
  return rows.map(mapNotification);
}

export async function createNotifications(userIds: string[], message: string) {
  const rows = await request<SupabaseNotificationRow[]>("notifications", {
    method: "POST",
    prefer: "return=representation",
    body: userIds.map((userId) => ({
      id: randomUUID(),
      user_id: userId,
      message,
      read: false,
    })),
  });

  return rows.map(mapNotification);
}

export async function markNotificationReadById(id: string) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
  });

  const rows = await request<SupabaseNotificationRow[]>(`notifications?${params.toString()}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: { read: true },
  });

  return rows[0] ? mapNotification(rows[0]) : null;
}

export async function listPushSubscriptionsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    select: "*",
    user_id: `in.${toInFilter(userIds)}`,
  });

  const rows = await request<SupabasePushSubscriptionRow[]>(`push_subscriptions?${params.toString()}`);
  return rows.map(mapPushSubscription);
}

export async function upsertPushSubscriptionRecord(args: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  await request<SupabasePushSubscriptionRow[]>("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [
      {
        id: randomUUID(),
        user_id: args.userId,
        endpoint: args.endpoint,
        p256dh: args.p256dh,
        auth: args.auth,
      },
    ],
  });
}

export async function deletePushSubscriptionById(id: string) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
  });

  await request<void>(`push_subscriptions?${params.toString()}`, {
    method: "DELETE",
  });
}

export async function deletePushSubscriptionsByUser(userId: string) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
  });

  await request<void>(`push_subscriptions?${params.toString()}`, {
    method: "DELETE",
  });
}
