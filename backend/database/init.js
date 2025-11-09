const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

async function initDatabase() {
  try {
    console.log("🔄 Initializing database...");

    const sqlFile = path.join(__dirname, "init.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Split SQL commands by semicolon and execute
    const commands = sql.split(";").filter((cmd) => cmd.trim());

    for (const command of commands) {
      if (command.trim()) {
        await pool.query(command);
      }
    }

    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

initDatabase();
