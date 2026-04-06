import { Router, type IRouter } from "express";
import { eq, or, ilike, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
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
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;

  let users;
  if (search) {
    users = await db
      .select()
      .from(usersTable)
      .where(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.phone, `%${search}%`),
          ilike(usersTable.id, `%${search}%`)
        )
      )
      .orderBy(usersTable.createdAt);
  } else {
    users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  }

  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, phone } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const id = randomUUID();
  const qrCode = id;

  const [user] = await db
    .insert(usersTable)
    .values({ id, name, phone, qrCode, punchCount: 0, totalPunches: 10 })
    .returning();

  res.status(201).json(GetUserResponse.parse(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

router.post("/users/:id/punch", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddPunchParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ punchCount: sql`${usersTable.punchCount} + 1` })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(AddPunchResponse.parse(user));
});

router.post("/users/:id/remove-punch", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemovePunchParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newCount = Math.max(0, existing.punchCount - 1);

  const [user] = await db
    .update(usersTable)
    .set({ punchCount: newCount })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  res.json(RemovePunchResponse.parse(user));
});

router.post("/users/:id/reset", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResetPunchesParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ punchCount: 0 })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(ResetPunchesResponse.parse(user));
});

export default router;
