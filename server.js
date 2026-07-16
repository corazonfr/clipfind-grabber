import express from "express";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";

const app = express();
app.use(express.json());
app.use((_, res, next) => { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Headers", "Content-Type"); next(); });
app.options("*", (_, res) => res.sendStatus(204));

const OK = /(^|\.)(twitch\.tv|youtube\.com|youtu\.be|clips\.twitch\.tv)$/i;

app.post("/grab", (req, res) => {
  const url = String(req.body?.url || "");
  let host; try { host = new URL(url).hostname; } catch { return res.status(400).json({ error: "bad url" }); }
  if (!OK.test(host)) return res.status(400).json({ error: "only twitch/youtube allowed" });

  const out = `/tmp/${randomUUID()}.mp4`;
  execFile("yt-dlp", ["-f", "best[height<=720][ext=mp4]/best[ext=mp4]/best", "--no-playlist", "-o", out, url],
    { timeout: 1000 * 60 * 20 }, (err) => {
      if (err || !fs.existsSync(out)) return res.status(500).json({ error: "download failed: " + (err?.message || "") });
      res.download(out, "vod.mp4", () => fs.unlink(out, () => {}));
    });
});

app.get("/", (_, res) => res.send("clipfind-grabber up"));
app.listen(3000, () => console.log("up on 3000"));
