import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import getPort, { portNumbers } from "get-port";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("paddy_tracker.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'labour',
    onboarded INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lorries (    
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lorry_number TEXT NOT NULL,
    driver_name TEXT,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'loading'
  );

  CREATE TABLE IF NOT EXISTS farmer_loads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lorry_id INTEGER,
    farmer_name TEXT NOT NULL,
    bag_count INTEGER NOT NULL,
    labour_title TEXT,
    moisture_percent REAL,
    weight_qlt REAL,
    paddy_type TEXT,
    area TEXT,
    FOREIGN KEY(lorry_id) REFERENCES lorries(id)
  );

  CREATE TABLE IF NOT EXISTS labours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paddy_markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    unit TEXT DEFAULT '/qtl',
    change_percent REAL DEFAULT 0,
    region TEXT,
    trend_json TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migration: Add columns to farmer_loads if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(farmer_loads)").all() as any[];
  const addColumn = (name: string, type: string) => {
    if (!tableInfo.some((col) => col.name === name)) {
      db.prepare(`ALTER TABLE farmer_loads ADD COLUMN ${name} ${type}`).run();
      console.log(`Migration: Added ${name} column to farmer_loads`);
    }
  };
  addColumn('labour_title', 'TEXT');
  addColumn('moisture_percent', 'REAL');
  addColumn('weight_qlt', 'REAL');
  addColumn('paddy_type', 'TEXT');
  addColumn('area', 'TEXT');
} catch (e: any) {
  console.error("Migration error:", e.message);
}

// Seed basic market entries if none exist
try {
  const count = db.prepare('SELECT COUNT(*) as c FROM paddy_markets').get();
  if (!count || count.c === 0) {
    const sample = [
      { name: 'Paddy (Sona Masoori)', price: 2100, unit: '/qtl', change: 2.5, region: 'Kurnool', trend: [1700,1800,1850,2000,2100,2200,2100] },
      { name: 'Basmati (1121)', price: 3850, unit: '/qtl', change: 1.2, region: 'Punjab', trend: [3600,3700,3800,3820,3840,3860,3850] },
      { name: 'RNR 15048', price: 2340, unit: '/qtl', change: -0.8, region: 'Local', trend: [2300,2320,2330,2345,2350,2340,2340] },
      { name: 'Sharbati', price: 3100, unit: '/qtl', change: 0.5, region: 'Madhya', trend: [2800,2900,2950,3000,3050,3080,3100] }
    ];
    const insert = db.prepare('INSERT INTO paddy_markets (name, price, unit, change_percent, region, trend_json) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMany = db.transaction((rows: any[]) => {
      for (const r of rows) insert.run(r.name, r.price, r.unit, r.change, r.region, JSON.stringify(r.trend));
    });
    insertMany(sample);
    console.log('Seeded sample paddy market entries');
  }
} catch (e: any) {
  console.error('Market seed error:', e.message);
}

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());
  app.use(cors());

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { username, password, full_name } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)").run(username, password, full_name);
      res.json({ id: result.lastInsertRowid, username, full_name, onboarded: 0 });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ id: user.id, username: user.username, full_name: user.full_name, onboarded: user.onboarded });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/onboard", (req, res) => {
    const { userId } = req.body;
    db.prepare("UPDATE users SET onboarded = 1 WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  // API Routes
  
  // Get all lorries for a specific date
  app.get("/api/lorries", (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const lorries = db.prepare("SELECT * FROM lorries WHERE date = ?").all(date);
      
      // Enrich with total bags
      const enrichedLorries = lorries.map((lorry: any) => {
        const loads = db.prepare("SELECT SUM(bag_count) as total FROM farmer_loads WHERE lorry_id = ?").get(lorry.id) as any;
        return { ...lorry, total_bags: loads?.total || 0 };
      });
      
      res.json(enrichedLorries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a new lorry record
  app.post("/api/lorries", (req, res) => {
    try {
      const { lorry_number, driver_name, date } = req.body;
      
      // Prevent future dates
      const today = new Date().toISOString().split('T')[0];
      if (date > today) {
        return res.status(400).json({ error: "Cannot create records for future dates" });
      }

      const result = db.prepare("INSERT INTO lorries (lorry_number, driver_name, date) VALUES (?, ?, ?)").run(lorry_number, driver_name, date);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get details for a specific lorry
  app.get("/api/lorries/:id", (req, res) => {
    try {
      const lorry = db.prepare("SELECT * FROM lorries WHERE id = ?").get(req.params.id);
      if (!lorry) return res.status(404).json({ error: "Lorry not found" });
      const loads = db.prepare("SELECT * FROM farmer_loads WHERE lorry_id = ?").all(req.params.id);
      console.log(`[GET /api/lorries/${req.params.id}] Loads found:`, loads);
      res.json({ ...lorry, loads });
    } catch (err: any) {
      console.error(`[GET /api/lorries/${req.params.id}] Error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Add a farmer load to a lorry
  app.post("/api/lorries/:id/loads", (req, res) => {
    try {
      const { farmer_name, bag_count, labour_title, moisture_percent, weight_qlt, paddy_type, area } = req.body;
      const lorry_id = req.params.id;
      console.log(`[POST /api/lorries/${lorry_id}/loads] Body:`, req.body);
      // Validate required fields
      if (!farmer_name || typeof farmer_name !== 'string') {
        return res.status(400).json({ error: 'Farmer name is required.' });
      }
      const bagCountInt = parseInt(bag_count);
      if (isNaN(bagCountInt) || bagCountInt <= 0) {
        return res.status(400).json({ error: 'Bag count must be a positive integer.' });
      }
      // Check lorry exists
      const lorry = db.prepare('SELECT id FROM lorries WHERE id = ?').get(lorry_id);
      if (!lorry) {
        return res.status(400).json({ error: 'Lorry not found.' });
      }
      const result = db.prepare("INSERT INTO farmer_loads (lorry_id, farmer_name, bag_count, labour_title, moisture_percent, weight_qlt, paddy_type, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(lorry_id, farmer_name, bagCountInt, labour_title, moisture_percent, weight_qlt, paddy_type, area);
      console.log(`[POST /api/lorries/${lorry_id}/loads] Inserted ID:`, result.lastInsertRowid);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      console.error(`[POST /api/lorries/${req.params.id}/loads] Error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a farmer load
  app.delete("/api/loads/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM farmer_loads WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update lorry status
  app.patch("/api/lorries/:id", (req, res) => {
    try {
      const { status } = req.body;
      db.prepare("UPDATE lorries SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Labour Management
  app.get("/api/labours", (req, res) => {
    try {
      const labours = db.prepare("SELECT * FROM labours").all();
      res.json(labours);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/labours", (req, res) => {
    try {
      const { name, title_name } = req.body;
      const result = db.prepare("INSERT INTO labours (name, title_name) VALUES (?, ?)").run(name, title_name);
      res.json({ id: result.lastInsertRowid, name, title_name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/labours/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM labours WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/labour-titles", (req, res) => {
    try {
      const titles = db.prepare("SELECT DISTINCT title_name FROM labours").all();
      res.json(titles.map((t: any) => t.title_name));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Market rates
  app.get('/api/markets', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM paddy_markets ORDER BY updated_at DESC').all();
      const parsed = rows.map((r: any) => ({
        ...r,
        trend: r.trend_json ? JSON.parse(r.trend_json) : undefined
      }));
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/markets', (req, res) => {
    try {
      const { name, price, unit, change_percent, region, trend } = req.body;
      const trend_json = trend ? JSON.stringify(trend) : null;
      const result = db.prepare('INSERT INTO paddy_markets (name, price, unit, change_percent, region, trend_json) VALUES (?, ?, ?, ?, ?, ?)').run(name, price, unit || '/qtl', change_percent || 0, region || null, trend_json);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/markets/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM paddy_markets WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    try {
      const totalLorries = db.prepare("SELECT COUNT(*) as count FROM lorries").get() as any;
      const totalBags = db.prepare("SELECT SUM(bag_count) as count FROM farmer_loads").get() as any;
      const totalFarmers = db.prepare("SELECT COUNT(DISTINCT farmer_name) as count FROM farmer_loads").get() as any;
      
      // Bags and lorries per day for chart
      const dailyStats = db.prepare(`
        SELECT l.date, COALESCE(SUM(fl.bag_count), 0) as bags, COUNT(DISTINCT l.id) as lorries
        FROM lorries l 
        LEFT JOIN farmer_loads fl ON l.id = fl.lorry_id 
        GROUP BY l.date 
        ORDER BY l.date DESC 
        LIMIT 7
      `).all();

      // Top farmers
      const topFarmers = db.prepare(`
        SELECT farmer_name, SUM(bag_count) as bags 
        FROM farmer_loads 
        GROUP BY farmer_name 
        ORDER BY bags DESC 
        LIMIT 5
      `).all();

      // Labour Performance
      const labourPerformance = db.prepare(`
        SELECT labour_title, SUM(bag_count) as bags 
        FROM farmer_loads 
        WHERE labour_title IS NOT NULL
        GROUP BY labour_title 
        ORDER BY bags DESC
      `).all();

      // Paddy Type Stats (area-wise)
      const paddyTypeStats = db.prepare(`
        SELECT area, paddy_type, SUM(bag_count) as bags
        FROM farmer_loads
        WHERE paddy_type IS NOT NULL AND paddy_type != '' AND area IS NOT NULL AND area != ''
        GROUP BY area, paddy_type
        ORDER BY area, bags DESC
      `).all();

      res.json({
        totalLorries: totalLorries.count,
        totalBags: totalBags.count || 0,
        totalFarmers: totalFarmers.count,
        dailyStats: dailyStats.reverse(),
        topFarmers,
        labourPerformance,
        paddyTypeStats
      });
    } catch (err: any) {
      console.error("Stats error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
  root: process.cwd(),
  server: {
    middlewareMode: true
  },
  appType: "spa"
});
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  // Optionally, write the port to a file for frontend or tooling
  try {
    require('fs').writeFileSync('server-port.txt', PORT.toString());
  } catch (e) {
    // ignore if fs is not available
  }
}

startServer();
