import * as mongoose from "mongoose";
import { config } from "dotenv";
import * as path from "path";

// Load environment variables
config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pm2-dashboard";

interface ServiceDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdBy?: mongoose.Types.ObjectId;
  visibility?: string;
  githubTokenId?: mongoose.Types.ObjectId;
}

interface UserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  role: string;
}

async function migrateServices() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get Service and User models
    const ServiceSchema = new mongoose.Schema({}, { strict: false });
    const UserSchema = new mongoose.Schema({}, { strict: false });

    const Service = mongoose.model<ServiceDocument>("Service", ServiceSchema);
    const User = mongoose.model<UserDocument>("User", UserSchema);

    // Find admin user
    console.log("Finding admin user...");
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.error("No admin user found! Please create an admin user first.");
      process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.username} (${adminUser._id})`);

    // Find services without createdBy
    console.log("Finding services without createdBy...");
    const servicesWithoutOwner = await Service.find({
      $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
    });

    console.log(`Found ${servicesWithoutOwner.length} services to migrate`);

    if (servicesWithoutOwner.length === 0) {
      console.log("No services need migration. Exiting.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Migrate each service
    let migrated = 0;
    let skipped = 0;

    for (const service of servicesWithoutOwner) {
      try {
        const updateData: any = {
          createdBy: adminUser._id,
          visibility: "private",
        };

        // Only update if fields don't exist or are null
        if (!service.createdBy) {
          updateData.createdBy = adminUser._id;
        }

        if (!service.visibility) {
          updateData.visibility = "private";
        }

        await Service.updateOne({ _id: service._id }, { $set: updateData });

        console.log(
          `✓ Migrated service: ${service.name} (${service._id}) - Assigned to ${adminUser.username}, set to private`
        );
        migrated++;
      } catch (error) {
        console.error(
          `✗ Failed to migrate service ${service.name} (${service._id}):`,
          error
        );
        skipped++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total services found: ${servicesWithoutOwner.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed/Skipped: ${skipped}`);

    // Verify migration
    const remainingServices = await Service.find({
      $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
    });

    if (remainingServices.length > 0) {
      console.log(
        `\n⚠ Warning: ${remainingServices.length} services still without owner:`
      );
      remainingServices.forEach((s) => {
        console.log(`  - ${s.name} (${s._id})`);
      });
    } else {
      console.log("\n✓ All services have been migrated successfully!");
    }

    await mongoose.disconnect();
    console.log("\nMigration completed. Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateServices();
