module.exports = {
  databasePath: process.env.DB_PATH || "data/app.db",
  jwtKey: process.env.JWT_KEY || "paper-lantern-shared-key",
  webhookKey: process.env.WEBHOOK_KEY || "billing-webhook-key-2026",
  reportDir: process.env.REPORT_DIR || "tmp"
};
