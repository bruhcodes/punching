import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ err }, "Unhandled API Error");
  res.status(500).json({ 
    error: "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined 
  });
});

export default app;
