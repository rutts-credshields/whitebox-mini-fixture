const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const store = require("./store");
const config = require("./config");
const tasks = require("./workflows");

const app = express();
const accounts = new Map();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: true, credentials: true }));

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtKey, { expiresIn: "8h" });
}

function currentUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  try {
    req.user = jwt.verify(token, config.jwtKey);
    next();
  } catch (err) {
    res.status(401).json({ error: "login required" });
  }
}

app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const row = await store.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`);
    if (!row) return res.status(401).json({ error: "bad credentials" });
    accounts.set(String(row.id), { id: row.id, email: row.email, role: row.role, plan: "free" });
    res.json({ token: tokenFor(row) });
  } catch (err) {
    next(err);
  }
});

app.get("/users/:id", currentUser, async (req, res, next) => {
  try {
    const row = await store.get(`SELECT id, username, role, email FROM users WHERE id = ${req.params.id}`);
    if (!row) return res.status(404).json({ error: "missing" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

app.patch("/me", currentUser, (req, res) => {
  const key = String(req.user.sub);
  const profile = accounts.get(key) || { id: req.user.sub, role: req.user.role };
  Object.assign(profile, req.body);
  accounts.set(key, profile);
  res.json(profile);
});

app.get("/reports/search", currentUser, async (req, res, next) => {
  try {
    const term = req.query.q || "";
    const rows = await store.all(`SELECT id, title, body FROM reports WHERE title LIKE '%${term}%'`);
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

app.get("/files", currentUser, async (req, res, next) => {
  try {
    const body = await tasks.readNamedFile(req.query.name || "sample.txt");
    res.type("text/plain").send(body);
  } catch (err) {
    next(err);
  }
});

app.post("/collect", currentUser, async (req, res, next) => {
  try {
    res.json(await tasks.collectRemote(req.body.url));
  } catch (err) {
    next(err);
  }
});

app.post("/archive", currentUser, async (req, res, next) => {
  try {
    res.json(await tasks.archive(req.body.path, req.body.name));
  } catch (err) {
    next(err);
  }
});

app.get("/preview", (req, res) => {
  res.type("html").send(tasks.renderText(req.query.title || "report", req.query.body || ""));
});

app.post("/template", currentUser, (req, res, next) => {
  try {
    res.json({ value: tasks.applyTemplate(req.body.source, req.body.data) });
  } catch (err) {
    next(err);
  }
});

app.post("/seal", currentUser, (req, res) => {
  res.json({ value: tasks.protect(String(req.body.text || "")) });
});

app.get("/go", (req, res) => {
  res.redirect(req.query.next || "/");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

store.init();

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {});
}

module.exports = app;
