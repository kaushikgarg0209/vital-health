import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./services/healthService.js";

async function start() {
  console.log(`Supabase URL: ${env.SUPABASE_URL}`);
  console.log("Checking database connection...");

  const database = await verifyDatabaseConnection();

  if (database.ok) {
    console.log(`Database connection: OK (${database.latencyMs}ms)`);
  } else {
    console.warn(`Database connection: FAILED - ${database.error}`);
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running at ${env.BASE_URL}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
