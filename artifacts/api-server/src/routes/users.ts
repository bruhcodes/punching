import { Router, type IRouter } from "express";
import {
  GetUserParams,
  AddPunchParams,
  RemovePunchParams,
  ResetPunchesParams,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserResponse,
  AddPunchResponse,
  RemovePunchResponse,
  ResetPunchesResponse,
} from "@workspace/api-zod";
import {
  createUserRecord,
  deleteUserRecord,
  findUserByPhone,
  getUserById,
  listUsers,
  updateUserRecord,
  updateUserPunchCount,
  createNotifications,
} from "../lib/supabase";
import { sendWebPush } from "../lib/push";

const router: IRouter = Router();

function parseCreateUserBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const candidate = body as Record<string, unknown>;
  if (typeof candidate.name !== "string" || typeof candidate.phone !== "string") return null;

  return {
    name: candidate.name,
    phone: candidate.phone,
    avatarUrl: typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : undefined,
  };
}

function parseUpdateUserBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const candidate = body as Record<string, unknown>;
  const parsed: { name?: string; phone?: string; avatarUrl?: string; totalPunches?: number } = {};

  if (candidate.name !== undefined) {
    if (typeof candidate.name !== "string") return null;
    parsed.name = candidate.name;
  }
  if (candidate.phone !== undefined) {
    if (typeof candidate.phone !== "string") return null;
    parsed.phone = candidate.phone;
  }
  if (candidate.avatarUrl !== undefined) {
    if (typeof candidate.avatarUrl !== "string") return null;
    parsed.avatarUrl = candidate.avatarUrl;
  }
  if (candidate.totalPunches !== undefined) {
    if (typeof candidate.totalPunches !== "number") return null;
    parsed.totalPunches = candidate.totalPunches;
  }

  return parsed;
}

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;

  const users = await listUsers(search);

  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = parseCreateUserBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, phone, avatarUrl } = parsed;

  const existing = await findUserByPhone(phone);
  if (existing) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const user = await createUserRecord(name, phone, avatarUrl);

  res.status(201).json(GetUserResponse.parse(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await getUserById(params.data.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const body = parseUpdateUserBody(req.body);
  if (body?.totalPunches !== undefined) {
    const adminPassword = req.headers["x-admin-password"];
    if (adminPassword !== "12345") {
      res.status(401).json({ error: "Unauthorized: Invalid admin password" });
      return;
    }
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: raw });

  if (!params.success || !body) {
    res.status(400).json({ error: params.success ? "Invalid request body" : params.error.message });
    return;
  }

  const existing = await getUserById(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (body.phone && body.phone !== existing.phone) {
    const phoneMatch = await findUserByPhone(body.phone);
    if (phoneMatch && phoneMatch.id !== existing.id) {
      res.status(409).json({ error: "Phone number already registered" });
      return;
    }
  }

  const user = await updateUserRecord(params.data.id, body);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await getUserById(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await deleteUserRecord(params.data.id);
  res.status(204).send();
});

router.post("/users/:id/punch", async (req, res): Promise<void> => {
  const adminPassword = req.headers["x-admin-password"];
  if (adminPassword !== "12345") {
    res.status(401).json({ error: "Unauthorized: Invalid admin password" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddPunchParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await getUserById(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const nextPunchCount = Math.min(existing.totalPunches, existing.punchCount + 1);
  const user = await updateUserPunchCount(params.data.id, nextPunchCount);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const msg = `You earned a punch! 🌟 (${user.punchCount}/${user.totalPunches})`;
    await createNotifications([user.id], msg);
    sendWebPush([user.id], msg).catch(() => {});
  } catch (err) {
    // ignore notification error
  }

  res.json(AddPunchResponse.parse(user));
});

router.post("/users/:id/remove-punch", async (req, res): Promise<void> => {
  const adminPassword = req.headers["x-admin-password"];
  if (adminPassword !== "12345") {
    res.status(401).json({ error: "Unauthorized: Invalid admin password" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemovePunchParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await getUserById(params.data.id);

  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = await updateUserPunchCount(params.data.id, Math.max(0, existing.punchCount - 1));

  res.json(RemovePunchResponse.parse(user));
});

router.post("/users/:id/reset", async (req, res): Promise<void> => {
  const adminPassword = req.headers["x-admin-password"];
  if (adminPassword !== "12345") {
    res.status(401).json({ error: "Unauthorized: Invalid admin password" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResetPunchesParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await updateUserPunchCount(params.data.id, 0);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(ResetPunchesResponse.parse(user));
});

export default router;
