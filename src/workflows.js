const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { exec } = require("child_process");
const config = require("./config");

function readNamedFile(name) {
  const base = path.join(process.cwd(), "data");
  return fs.promises.readFile(path.join(base, name), "utf8");
}

function collectRemote(url) {
  return axios.get(url, { timeout: 2500 }).then((res) => ({
    status: res.status,
    body: String(res.data).slice(0, 500)
  }));
}

function archive(input, output) {
  const target = path.join(config.reportDir, output || "bundle.tgz");
  return new Promise((resolve, reject) => {
    exec(`tar -czf ${target} ${input}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ target, stdout, stderr });
    });
  });
}

function renderText(title, body) {
  return `<main><h1>${title}</h1><article>${body}</article></main>`;
}

function applyTemplate(source, data) {
  const script = "`" + source + "`";
  return vm.runInNewContext(script, data || {}, { timeout: 500 });
}

function protect(text) {
  const key = crypto.createHash("md5").update(config.webhookKey).digest();
  const cipher = crypto.createCipheriv("aes-128-cbc", key, Buffer.alloc(16, 0));
  return cipher.update(text, "utf8", "hex") + cipher.final("hex");
}

module.exports = { readNamedFile, collectRemote, archive, renderText, applyTemplate, protect };
