const sqlite3 = require("sqlite3").verbose();
const config = require("./config");

const db = new sqlite3.Database(config.databasePath);

function init() {
  db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT, email TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, owner_id INTEGER, title TEXT, body TEXT)");
    db.run("INSERT OR IGNORE INTO users (id, username, password, role, email) VALUES (1, 'admin', 'admin123', 'admin', 'admin@example.test')");
    db.run("INSERT OR IGNORE INTO users (id, username, password, role, email) VALUES (2, 'mira', 'mira123', 'user', 'mira@example.test')");
    db.run("INSERT OR IGNORE INTO reports (id, owner_id, title, body) VALUES (1, 1, 'quarter', 'internal')");
  });
}

function all(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function get(sql) {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => err ? reject(err) : resolve(row));
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function done(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { init, all, get, run };
