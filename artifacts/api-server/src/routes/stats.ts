import { Router, type IRouter } from "express";
import { GetStatsResponse } from "@workspace/api-zod";
import { listUsers } from "../lib/supabase";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const users = await listUsers();

  const totalUsers = users.length;
  const totalPunches = users.reduce((sum, u) => sum + u.punchCount, 0);
  const completedCards = users.filter((u) => u.punchCount >= u.totalPunches).length;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeToday = users.filter((u) => new Date(u.createdAt) >= oneDayAgo).length;

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
