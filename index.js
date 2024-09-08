import express from "express";
import helmet from "helmet";
import sqlite3 from "sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let db = await new Promise((resolve, reject) => {
  let db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
      console.error(err.message);
      reject(err);
      return;
    }
    console.log("Successfully connected to SQLite");
    resolve(db);
  });
});

// Check
app.get(`/check`, (req, res) => {
  res.send("Server is running");
});
// Get
app.get(`/:token/:key`, async (req, res) => {
  let rows = await new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM ? WHERE key = ?",
      [req.params.token, req.params.key],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      },
    );
  });
  if (rows.length > 0) {
    res.send(rows[0].value);
  } else {
    res.status(404); // Not Found
    res.send("");
  }
});
// List
app.get(`/:token`, async (req, res) => {
  let rows = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM ?", [req.params.token], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
  if (rows.length > 0) {
    res.send(rows.map((row) => row.key).join("\n"));
  } else {
    res.status(404); // Not Found
    res.send("");
  }
});
// Set
app.post(`/:token`, async (req, res) => {
  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS '${token}' (key TEXT PRIMARY KEY, value TEXT)`,
      [],
      (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }
        console.log(`Successfully created table '${token}'`);
        resolve();
      },
    );
  });
  let status = 400;
  let keys = Object.keys(req.body);
  for (let i = 0; i < keys.length; i++) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ? (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [req.params.token, keys[i], req.body[keys[i]]],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(`Successfully upserted value '${key}'='${value}'`);
          resolve();
        },
      );
    });
    status = 204; // No Content
  }
  res.status(status);
  res.send("");
});
// Delete
app.delete(`/:token/:key`, async (req, res) => {
  let status = 404;
  let rows = await new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM ? WHERE key = ?",
      [req.params.token, req.params.key],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      },
    );
  });
  if (rows.length > 0) {
    await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM ? WHERE key = ?`,
        [req.params.token, req.params.key],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(`Successfully upserted value '${key}'='${value}'`);
          resolve();
        },
      );
    });
    status = 204;
    res.status(status);
    res.send("");
  }
});
app.use("/", (req, res, next) => {
  res.status(404); // Unknown route
  res.send("Unknown route");
});

app.listen(1337);
console.log("Server listening on port 1337");
