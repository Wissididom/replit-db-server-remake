import sqlite3 from "sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: node migrate.js <token/table>");
  process.exit(1);
}
let token = args[0];

if (fs.existsSync(path.join(__dirname + `/${token}`))) {
  let keys = fs
    .readdirSync(path.join(__dirname + `/${token}`), {
      withFileTypes: true,
    })
    .filter((file) => !file.isDirectory())
    .map((file) => file.name.replace(".txt", ""));
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
  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS '${token}' (key TEXT, value TEXT)`,
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
  for (let key of keys) {
    let value = fs.readFileSync(
      path.join(__dirname + `/${token}/${key}.txt`),
      "utf8",
    );
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO '${token}' (key, value) VALUES (?, ?)`,
        [key, value],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(`Successfully inserted value '${key}'='${value}'`);
          resolve();
        },
      );
    });
    console.log(`${key}:`);
    console.log(value);
  }
}
