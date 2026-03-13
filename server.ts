import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("announcements.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Admin Token
  const ADMIN_TOKEN = "admin-secret-token-2026";

  // Middleware to check admin token
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
      next();
    } else {
      res.status(401).json({ status: "error", message: "Unauthorized" });
    }
  };

  // 1. Endpoint for announcements (Admin)
  app.post("/api/v1/admin/announcements", adminAuth, (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ status: "error", message: "Message is required" });
    }

    // Save to history
    const stmt = db.prepare("INSERT INTO announcements (message) VALUES (?)");
    stmt.run(message);

    // Create notification for users
    const notifStmt = db.prepare("INSERT INTO notifications (message) VALUES (?)");
    notifStmt.run(message);

    res.json({
      status: "ok",
      message: message,
      push_queued: 200 // Mock value as requested
    });
  });

  // Get announcement history (Admin)
  app.get("/api/v1/admin/announcements/history", adminAuth, (req, res) => {
    const history = db.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all();
    res.json(history);
  });

  // 4. Endpoint for notifications (User)
  app.get("/api/v1/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all();
    res.json(notifications);
  });

  app.get("/api/v1/notifications/unread_count", (req, res) => {
    const count = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0").get() as { count: number };
    res.json({ unread_count: count.count });
  });

  // Mark all as read (User)
  app.post("/api/v1/notifications/read_all", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1").run();
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
