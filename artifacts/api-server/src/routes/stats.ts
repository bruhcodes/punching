import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} desc`);

  const totalUsers = users.length;
  const totalPunches = users.reduce((sum, u) => sum + u.punchCount, 0);
  const completedCards = users.filter((u) => u.punchCount >= u.totalPunches).length;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeToday = users.filter((u) => u.createdAt >= oneDayAgo).length;

  const recentUsers = users.slice(0, 5);

  res.json(
    GetStatsResponse.parse({
      totalUsers,
      totalPunches,
      completedCards,
      activeToday,
      recentUsers,
    })
  );
});

export default router;
