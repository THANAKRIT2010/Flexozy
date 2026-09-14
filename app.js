// app.js — FLEXOZY DEBUG VERSION
// ใช้สำหรับตรวจหาสาเหตุ {"error":"internal_error"} บน Vercel
//
// หลังแก้ปัญหาแล้วควรเปลี่ยนกลับเป็น app.js ปกติ
//
// DEBUG CHECKPOINTS:
// 1. BOOT
// 2. CONFIG
// 3. CONTROLLERS
// 4. MIDDLEWARE
// 5. ROUTES
// 6. SESSION
// 7. STATIC
// 8. REQUEST
// 9. ERROR

require("express-async-errors");

const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");
const cors = require("cors");
const helmet = require("helmet");

console.log("==================================================");
console.log("[FLEXOZY DEBUG] BOOT START");
console.log("[FLEXOZY DEBUG] Node:", process.version);
console.log("[FLEXOZY DEBUG] NODE_ENV:", process.env.NODE_ENV);
console.log("==================================================");

const boot = {
  startedAt: new Date().toISOString(),
  config: false,
  controllers: false,
  middleware: false,
  routes: false,
  appCreated: false,
  session: false,
  static: false,
};

let config;
let vaultController;
let trackSession;
let trackLastSeen;
let enforceBan;
let trackDailyVisit;
let maintenanceGate;
let adminAudit;
let isCurrentAdmin;
let routes;

// ============================================================
// SAFE REQUIRE
// ============================================================

function loadModule(name, loader) {
  console.log(`[FLEXOZY DEBUG] Loading: ${name}`);

  try {
    const result = loader();

    console.log(`[FLEXOZY DEBUG] OK: ${name}`);

    return result;
  } catch (err) {
    console.error(`[FLEXOZY DEBUG] FAILED: ${name}`);
    console.error(err);

    throw new Error(
      `[MODULE_LOAD_FAILED] ${name}: ${err?.message || String(err)}`
    );
  }
}

// ============================================================
// CONFIG
// ============================================================

try {
  config = loadModule("./config/env", () =>
    require("./config/env")
  );

  boot.config = true;

  console.log("[FLEXOZY DEBUG] CONFIG LOADED");
  console.log("[FLEXOZY DEBUG] FRONTEND_URL:", config.FRONTEND_URL);
  console.log("[FLEXOZY DEBUG] API_HOST:", config.API_HOST);
  console.log("[FLEXOZY DEBUG] NODE_ENV:", config.NODE_ENV);

  // ห้ามแสดง SESSION_SECRET จริง
  console.log(
    "[FLEXOZY DEBUG] SESSION_SECRET:",
    config.SESSION_SECRET ? "SET" : "MISSING"
  );
} catch (err) {
  console.error("[FLEXOZY DEBUG] CONFIG ERROR:", err);
  throw err;
}

const {
  SESSION_SECRET,
  FRONTEND_URL,
  NODE_ENV,
  API_HOST,
} = config;

// ============================================================
// CONTROLLERS
// ============================================================

try {
  vaultController = loadModule(
    "./controllers/vault.controller",
    () => require("./controllers/vault.controller")
  );

  boot.controllers = true;

  console.log("[FLEXOZY DEBUG] CONTROLLERS LOADED");
} catch (err) {
  console.error("[FLEXOZY DEBUG] CONTROLLER ERROR:", err);
  throw err;
}

// ============================================================
// MIDDLEWARE
// ============================================================

try {
  const onlineTracker = loadModule(
    "./middleware/onlineTracker",
    () => require("./middleware/onlineTracker")
  );

  trackSession = onlineTracker.trackSession;

  const lastSeen = loadModule(
    "./middleware/lastSeen",
    () => require("./middleware/lastSeen")
  );

  trackLastSeen = lastSeen.trackLastSeen;

  const ban = loadModule(
    "./middleware/enforceBan",
    () => require("./middleware/enforceBan")
  );

  enforceBan = ban.enforceBan;

  const dailyStats = loadModule(
    "./middleware/dailyStats",
    () => require("./middleware/dailyStats")
  );

  trackDailyVisit = dailyStats.trackDailyVisit;

  const maintenance = loadModule(
    "./middleware/maintenanceMode",
    () => require("./middleware/maintenanceMode")
  );

  maintenanceGate = maintenance.maintenanceGate;

  const audit = loadModule(
    "./middleware/adminAudit",
    () => require("./middleware/adminAudit")
  );

  adminAudit = audit.adminAudit;

  const auth = loadModule(
    "./middleware/requireAuth",
    () => require("./middleware/requireAuth")
  );

  isCurrentAdmin = auth.isCurrentAdmin;

  boot.middleware = true;

  console.log("[FLEXOZY DEBUG] ALL MIDDLEWARE LOADED");
} catch (err) {
  console.error("[FLEXOZY DEBUG] MIDDLEWARE ERROR:", err);
  throw err;
}

// ============================================================
// ROUTES
// ============================================================

try {
  routes = loadModule(
    "./routes",
    () => require("./routes")
  );

  boot.routes = true;

  console.log("[FLEXOZY DEBUG] ROUTES LOADED");
} catch (err) {
  console.error("[FLEXOZY DEBUG] ROUTES ERROR:", err);
  throw err;
}

// ============================================================
// CREATE APP
// ============================================================

const app = express();

boot.appCreated = true;

console.log("[FLEXOZY DEBUG] EXPRESS APP CREATED");

// ============================================================
// TRUST PROXY
// ============================================================

console.log("[FLEXOZY DEBUG] Setting trust proxy");

app.set("trust proxy", 1);

console.log("[FLEXOZY DEBUG] trust proxy OK");

// ============================================================
// DEBUG STATUS
// ============================================================

// ชั่วคราวสำหรับตรวจสอบว่า app ถูกโหลดสำเร็จหรือไม่
app.get("/api/debug", (req, res) => {
  console.log("[FLEXOZY DEBUG] /api/debug REQUEST");

  res.status(200).json({
    ok: true,
    message: "Flexozy debug app is running",

    boot,

    environment: {
      NODE_ENV: NODE_ENV || null,
      FRONTEND_URL: FRONTEND_URL || null,
      API_HOST: API_HOST || null,
      SESSION_SECRET: SESSION_SECRET ? "SET" : "MISSING",
    },

    request: {
      method: req.method,
      path: req.path,
      hostname: req.hostname,
      protocol: req.protocol,
      secure: req.secure,
    },

    time: new Date().toISOString(),
  });
});

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  const started = Date.now();

  console.log(
    `[FLEXOZY DEBUG] REQUEST START ${req.method} ${req.originalUrl}`
  );

  res.on("finish", () => {
    console.log(
      `[FLEXOZY DEBUG] REQUEST END ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`
    );
  });

  next();
});

// ============================================================
// VAULT RAW-LINK SUBDOMAIN
// ============================================================

console.log("[FLEXOZY DEBUG] Registering Vault middleware");

app.use((req, res, next) => {
  const host = String(req.hostname || "").toLowerCase();

  console.log(
    `[FLEXOZY DEBUG] VAULT CHECK host=${host} API_HOST=${API_HOST}`
  );

  if (host !== API_HOST) {
    return next();
  }

  console.log("[FLEXOZY DEBUG] VAULT HOST MATCH");

  if (req.method !== "GET") {
    return res
      .status(404)
      .type("text/plain")
      .send("not_found");
  }

  const m = req.path.match(
    /^\/([A-Za-z0-9_-]{4,40})\/?$/
  );

  if (!m) {
    return res
      .status(200)
      .type("text/plain")
      .send("Flexozy Vault API");
  }

  req.params.code = m[1];

  console.log(
    "[FLEXOZY DEBUG] VAULT CODE REQUEST:",
    m[1]
  );

  return vaultController.rawView(req, res, next);
});

// ============================================================
// CORS
// ============================================================

console.log("[FLEXOZY DEBUG] Registering CORS");

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

console.log("[FLEXOZY DEBUG] CORS REGISTERED");

// ============================================================
// HELMET
// ============================================================

console.log("[FLEXOZY DEBUG] Registering Helmet");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

console.log("[FLEXOZY DEBUG] HELMET REGISTERED");

// ============================================================
// JSON
// ============================================================

console.log("[FLEXOZY DEBUG] Registering express.json");

app.use(express.json());

console.log("[FLEXOZY DEBUG] JSON REGISTERED");

// ============================================================
// SESSION
// ============================================================

console.log("[FLEXOZY DEBUG] Registering cookie-session");

if (!SESSION_SECRET) {
  console.error(
    "[FLEXOZY DEBUG] WARNING: SESSION_SECRET IS MISSING"
  );
}

app.use(
  cookieSession({
    name: "session",
    keys: [SESSION_SECRET],

    maxAge: 1000 * 60 * 60 * 24 * 7,

    httpOnly: true,

    sameSite: "lax",

    secure: NODE_ENV === "production",
  })
);

boot.session = true;

console.log("[FLEXOZY DEBUG] COOKIE SESSION REGISTERED");

// ============================================================
// SESSION ID
// ============================================================

console.log("[FLEXOZY DEBUG] Registering session ID middleware");

app.use((req, res, next) => {
  try {
    if (req.session && !req.session._sid) {
      req.session._sid =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
    }

    req.sessionID = req.session?._sid;

    console.log(
      "[FLEXOZY DEBUG] SESSION CHECK:",
      req.session ? "EXISTS" : "NONE"
    );

    next();
  } catch (err) {
    console.error(
      "[FLEXOZY DEBUG] SESSION ID ERROR:",
      err
    );

    next(err);
  }
});

// ============================================================
// DEBUG MIDDLEWARE WRAPPER
// ============================================================

function debugMiddleware(name, middleware) {
  return (req, res, next) => {
    console.log(
      `[FLEXOZY DEBUG] ENTER ${name} ${req.method} ${req.path}`
    );

    try {
      const result = middleware(req, res, (err) => {
        if (err) {
          console.error(
            `[FLEXOZY DEBUG] ERROR ${name}:`,
            err
          );
        } else {
          console.log(
            `[FLEXOZY DEBUG] NEXT ${name}`
          );
        }

        next(err);
      });

      // รองรับ middleware ที่ return Promise
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          console.error(
            `[FLEXOZY DEBUG] PROMISE ERROR ${name}:`,
            err
          );

          next(err);
        });
      }
    } catch (err) {
      console.error(
        `[FLEXOZY DEBUG] THROW ERROR ${name}:`,
        err
      );

      next(err);
    }
  };
}

// ============================================================
// APPLICATION MIDDLEWARE
// ============================================================

console.log("[FLEXOZY DEBUG] Registering application middleware");

app.use(
  debugMiddleware("trackSession", trackSession)
);

app.use(
  debugMiddleware("trackLastSeen", trackLastSeen)
);

app.use(
  debugMiddleware("enforceBan", enforceBan)
);

app.use(
  debugMiddleware(
    "trackDailyVisit",
    trackDailyVisit
  )
);

app.use(
  debugMiddleware(
    "maintenanceGate",
    maintenanceGate
  )
);

app.use(
  debugMiddleware(
    "adminAudit",
    adminAudit
  )
);

console.log(
  "[FLEXOZY DEBUG] APPLICATION MIDDLEWARE REGISTERED"
);

// ============================================================
// ADMIN
// ============================================================

console.log("[FLEXOZY DEBUG] Registering /admin");

app.get(
  ["/admin", "/admin/:subtab"],
  (req, res) => {
    console.log(
      "[FLEXOZY DEBUG] ADMIN REQUEST:",
      req.path
    );

    const user = req.session.user;

    const isAllowed =
      !!user &&
      (
        isCurrentAdmin(user) ||
        (
          Array.isArray(user.permissions) &&
          user.permissions.length > 0
        )
      );

    console.log(
      "[FLEXOZY DEBUG] ADMIN ALLOWED:",
      isAllowed
    );

    if (!isAllowed) {
      return res
        .status(404)
        .type("text/plain")
        .send("not_found");
    }

    res.sendFile(
      path.join(
        __dirname,
        "views",
        "admin.html"
      )
    );
  }
);

app.get(
  "/admin.html",
  (req, res) => {
    console.log(
      "[FLEXOZY DEBUG] Redirect /admin.html -> /admin"
    );

    res.redirect(301, "/admin");
  }
);

// ============================================================
// LOGIN
// ============================================================

console.log("[FLEXOZY DEBUG] Registering /login");

app.get("/login", (req, res) => {
  console.log("[FLEXOZY DEBUG] LOGIN REQUEST");

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "login.html"
    )
  );
});

app.get(
  "/login.html",
  (req, res) => {
    res.redirect(301, "/login");
  }
);

// ============================================================
// STATIC
// ============================================================

console.log("[FLEXOZY DEBUG] Registering static files");

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

boot.static = true;

console.log("[FLEXOZY DEBUG] STATIC REGISTERED");

// ============================================================
// ROUTES
// ============================================================

console.log("[FLEXOZY DEBUG] Registering main routes");

app.use(routes);

console.log("[FLEXOZY DEBUG] MAIN ROUTES REGISTERED");

// ============================================================
// SPA FALLBACK
// ============================================================

console.log("[FLEXOZY DEBUG] Registering SPA fallback");

app.get(
  /^(?!\/api\/|\/login\/|\/callback\/|\/logout)/,
  (req, res, next) => {
    console.log(
      "[FLEXOZY DEBUG] SPA FALLBACK:",
      req.path
    );

    if (req.method !== "GET") {
      return next();
    }

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  console.log(
    "[FLEXOZY DEBUG] 404:",
    req.method,
    req.originalUrl
  );

  res.status(404).json({
    error: "not_found",
    path: req.originalUrl,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("");
  console.error(
    "=================================================="
  );
  console.error("[FLEXOZY DEBUG] GLOBAL ERROR");
  console.error(
    "=================================================="
  );

  console.error("[FLEXOZY DEBUG] METHOD:", req.method);
  console.error(
    "[FLEXOZY DEBUG] URL:",
    req.originalUrl
  );
  console.error(
    "[FLEXOZY DEBUG] HOST:",
    req.hostname
  );
  console.error(
    "[FLEXOZY DEBUG] ERROR:",
    err
  );

  if (err?.stack) {
    console.error(
      "[FLEXOZY DEBUG] STACK:"
    );
    console.error(err.stack);
  }

  console.error(
    "=================================================="
  );

  if (res.headersSent) {
    return next(err);
  }

  // DEBUG MODE:
  // แสดง error ออกมาใน browser เพื่อหาต้นเหตุ
  res.status(500).json({
    error: "internal_error",

    debug: true,

    message:
      err?.message ||
      String(err),

    name:
      err?.name ||
      "Error",

    stack:
      err?.stack ||
      null,

    path:
      req.originalUrl,

    method:
      req.method,

    checkpoint: boot,
  });
});

// ============================================================
// FINAL BOOT
// ============================================================

console.log("");
console.log(
  "=================================================="
);
console.log("[FLEXOZY DEBUG] APP READY");
console.log("[FLEXOZY DEBUG] BOOT STATUS:");
console.log(boot);
console.log(
  "=================================================="
);

module.exports = app;
