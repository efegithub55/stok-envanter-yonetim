const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
const fs = require("fs");
const db = require("./config/database");
require("dotenv").config();
const User = require("./models/User");

const loginRouter = require("./routes/login");
const dashboardRouter = require("./routes/dashboard");
const productManagementRouter = require("./routes/product-management");
const stockManagementRouter = require("./routes/stock-management");
const reportsRouter = require("./routes/reports");
const apiRouter = require("./routes/api");

const auth = require("./middlewares/auth");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use("/storage", auth, express.static(path.join(__dirname, "storage")));

app.use((req, res, next) => {
  res.locals.session = req.session || null;
  next();
});

app.use((req, res, next) => {
  res.locals.alert = req.session.alert || null;
  req.session.alert = null;
  next();
});

app.use(async (req, res, next) => {
  req.user = null;
  res.locals.user = null;

  if (!req.session.userId) {
    return next();
  }

  try {
    let result = await User.findById(req.session.userId);
    const user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      return next();
    }

    req.user = user;
    res.locals.user = user;
  } catch (err) {
    console.error("User Middleware hata:", err);
  }

  next();
});

app.use("/login", loginRouter);
app.use("/", auth, dashboardRouter);
app.use("/urun-yonetimi", auth, productManagementRouter);
app.use("/stok-islemleri", auth, stockManagementRouter);
app.use("/raporlar", auth, reportsRouter);
app.use("/api", auth, apiRouter);

/* Veritabanı Yedek Alma Sistemi */

async function createFullBackup() {
  console.log("[DB BACKUP] Tam yedekleme başlatılıyor...");

  // 1) Tabloları al
  const [tables] = await db.query("SHOW TABLES");
  if (!tables.length) throw new Error("Veritabanında tablo bulunamadı.");

  const tableNames = tables.map((t) => Object.values(t)[0]);

  let dump = "";
  dump += "-- ===============================\n";
  dump += "--  INVENTO FULL DATABASE BACKUP\n";
  dump += `--  Created: ${new Date().toISOString()}\n`;
  dump += "-- ===============================\n\n";

  // 2) Her tablo için CREATE + INSERT
  for (const tableName of tableNames) {
    dump += `--\n-- TABLE: ${tableName}\n--\n\n`;

    // CREATE TABLE al
    const [createRows] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSQL = createRows[0]["Create Table"];

    dump += `${createSQL};\n\n`;

    // Tablodaki veriler
    const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);

    if (rows.length > 0) {
      dump += `-- DATA (${rows.length} rows)\n`;

      rows.forEach((row) => {
        const columns = Object.keys(row)
          .map((col) => `\`${col}\``)
          .join(", ");

        const values = Object.values(row)
          .map((v) =>
            v === null
              ? "NULL"
              : typeof v === "number"
              ? v
              : `'${String(v).replace(/'/g, "''")}'`
          )
          .join(", ");

        dump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      });

      dump += "\n";
    } else {
      dump += "-- Bu tabloda veri yok.\n\n";
    }
  }

  // 3) Dosyaya yaz
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const fileName = `${dd}-${mm}-${yyyy}.sql`;

  const saveDir = path.join(__dirname, "save");
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

  const filePath = path.join(saveDir, fileName);

  await fs.promises.writeFile(filePath, dump, "utf8");

  console.log("[DB BACKUP] Tam yedekleme tamamlandı:", filePath);

  return filePath;
}

function runDailyBackupWindow() {
  const windowStart = Date.now();
  const windowMs = 60 * 60 * 1000;
  let attempt = 0;

  async function tryOnce() {
    attempt++;
    console.log(`[DB BACKUP] Deneme ${attempt} başlıyor...`);

    try {
      await createSchemaBackup();
      console.log("[DB BACKUP] Yedekleme başarılı, tekrar denenmeyecek.");
    } catch (err) {
      console.error("[DB BACKUP] Yedekleme hatası:", err.message);

      const elapsed = Date.now() - windowStart;
      if (elapsed < windowMs) {
        console.log("[DB BACKUP] 10 dakika sonra tekrar denenecek...");
        setTimeout(tryOnce, 10 * 60 * 1000);
      } else {
        console.error(
          "[DB BACKUP] 1 saatlik yedekleme penceresi sona erdi, bugün için tekrar deneme yok."
        );
      }
    }
  }

  tryOnce();
}

function scheduleDailyBackup() {
  const now = new Date();

  // Sonraki 00:00'ı bul
  const nextMidnight = new Date(now);
  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  const delay = nextMidnight.getTime() - now.getTime();

  console.log(
    `[DB BACKUP] Günlük yedek planlandı. İlk çalıştırma: ${nextMidnight.toString()}`
  );

  setTimeout(() => {
    runDailyBackupWindow();

    setInterval(runDailyBackupWindow, 24 * 60 * 60 * 1000);
  }, delay);
}

app.listen(process.env.PORT, () => {
  console.log("WEB | Aktif | " + process.env.PORT);
  createFullBackup();
  runDailyBackupWindow();
});
