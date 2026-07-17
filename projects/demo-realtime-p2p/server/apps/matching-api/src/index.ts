import { Hono } from "hono";
import { cors } from "hono/cors";
import matchmaking from "./routes/matchmaking";

export type Env = {
  DB: D1Database;
  /** Host only, no scheme, e.g. your-project.your-user.partykit.dev */
  PARTYKIT_HOST: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.get("/health", (c) => c.text("ok"));
app.route("/api/matchmaking", matchmaking);

export default app;
