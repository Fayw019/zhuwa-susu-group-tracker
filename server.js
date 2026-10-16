import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public");
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
http.createServer(async (req,res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const name = pathname === "/" ? "index.html" : pathname.slice(1);
  const full = path.resolve(root, name);
  if (!full.startsWith(root + path.sep)) { res.writeHead(403); res.end("Forbidden"); return; }
  try { const data = await readFile(full); res.writeHead(200, {"Content-Type":mime[path.extname(full)] || "application/octet-stream"}); res.end(data); }
  catch { res.writeHead(404, {"Content-Type":"text/plain"}); res.end("Not found"); }
}).listen(Number(process.env.PORT || 3000), () => console.log("Susu Group Tracker: http://localhost:3000"));
