import { connect, model } from "mongoose";
import * as path from "path";
import {
  SystemConfig,
  SystemConfigSchema,
} from "../schemas/system-config.schema";

async function initDb() {
  try {
    // Connect to MongoDB
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/pm2-dashboard";
    await connect(uri);
    console.log("Connected to MongoDB");

    // Initialize system config
    const SystemConfigModel = model("SystemConfig", SystemConfigSchema);
    const config = await SystemConfigModel.findOne().exec();

    if (!config) {
      await SystemConfigModel.create({
        workingDirectory: path.join(process.cwd(), "repositories"),
      });
      console.log("Created default system configuration");
    }

    console.log("Database initialization completed");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDb();
