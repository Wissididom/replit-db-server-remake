// import express from "express";
// import helmet from "helmet";
import { DB } from "@x/sqlite";

function validateTableName(tableName: string) {
  return /^[a-zA-Z0-9_]+$/g.test(tableName);
}

const db = new DB("./database.db");
const [sqliteVersion] = db.query("SELECT sqlite_version()", [])[0];
console.log(sqliteVersion);

function handleExit(signal: string): void {
  db.close();
  console.log(signal);
  Deno.exit();
}

Deno.addSignalListener("SIGINT", () => handleExit("SIGINT"));

const port = () => {
  const p = Deno.env.get('PORT') ?? '';
  if (p && p.length > 0) {
    return parseInt(p, 10);
  } else {
    return 1337;
  }
};

Deno.serve({port: port()}, async (req) => {
  const checkMatch = new URLPattern({ pathname: "/check" }).exec(req.url);
  if (checkMatch && req.method.toUpperCase() == 'GET') {
    return new Response("Server is running");
  }
  const getMatch = new URLPattern({ pathname: "/:token/:key" }).exec(req.url);
  if (getMatch && req.method.toUpperCase() == 'GET') {
    if (validateTableName(getMatch.pathname.groups.token!)) {
      const rows = db.query(`SELECT * FROM '${getMatch.pathname.groups.token}' WHERE key = ?`, [getMatch.pathname.groups.key]);
      if (rows.length > 0) {
        return new Response(String(rows[0][0]));
      } else {
        return new Response("", { status: 404 }); // Not Found
      }
    } else {
      return new Response("Invalid table name");
    }
  }
  const listMatch = new URLPattern({ pathname: "/:token" }).exec(req.url);
  if (listMatch && req.method.toUpperCase() == 'GET') {
    if (validateTableName(listMatch.pathname.groups.token!)) {
      const rows = db.query(`SELECT * FROM '${listMatch.pathname.groups.token}'`, []);
      if (rows.length > 0) {
        return new Response(rows.map((row) => row[0]).join("\n"));
      } else {
        return new Response("", { status: 404 }); // Not Found
      }
    } else {
      return new Response("Invalid table name");
    }
  }
  const setMatch = new URLPattern({ pathname: "/:token" }).exec(req.url);
  if (setMatch && req.method.toUpperCase() == 'POST') {
    if (validateTableName(setMatch.pathname.groups.token!)) {
      db.execute(`CREATE TABLE IF NOT EXISTS '${setMatch.pathname.groups.token}' (key TEXT PRIMARY KEY, value TEXT)`);
      let status = 400;
      const body = await req.json();
      const keys = Object.keys(body);
      for (let i = 0; i < keys.length; i++) {
        db.query(`INSERT INTO '${setMatch.pathname.groups.token}' (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [keys[i], body[keys[i]]]);
        status = 204; // No Content
      }
      return new Response("", { status: status });
    } else {
      return new Response("Invalid table name");
    }
  }
  const deleteMatch = new URLPattern({ pathname: "/:token/:key" }).exec(req.url);
  if (deleteMatch && req.method.toUpperCase() == 'DELETE') {
    if (validateTableName(deleteMatch.pathname.groups.token!)) {
      const rows = db.query(`SELECT * FROM '${deleteMatch.pathname.groups.token}' WHERE key = ?`, [deleteMatch.pathname.groups.key]);
      if (rows.length > 0) {
        db.query(`DELETE FROM '${deleteMatch.pathname.groups.token}' WHERE key = ?`, [deleteMatch.pathname.groups.key]);
        return new Response(rows.map((row) => row[0]).join("\n"), { status: 204 });
      } else {
        return new Response("", { status: 404 }); // Not Found
      }
    } else {
      return new Response("Invalid table name");
    }
  }
  return new Response("Unknown route", { status: 404 });
});

globalThis.onunhandledrejection = (err) => {
  console.error(err);
}
