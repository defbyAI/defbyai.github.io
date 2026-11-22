// Run from a checkout with npm ci, FFmpeg, and Chrome (override with CHROME_BIN).
// node scripts/zeropl-duo-title/render.mjs [light|dark] [--preview-dir /tmp/title-stills]
import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { parseArgs, promisify } from "node:util";
import { build } from "vite";

const runCommand = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const assets = path.join(root, "public/zeropl");
const scratch = await mkdtemp(path.join(tmpdir(), "zeropl-duo-render-"));
const frameCount = 168;
const fps = 24;
const frameName = index => String(index).padStart(3, "0") + ".png";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "preview-dir": { type: "string" }, frames: { type: "string" } },
});
const themes = positionals.length ? positionals : ["light", "dark"];
const preview = values["preview-dir"];
const frames = preview
  ? [...new Set((values.frames ?? "0,36,54,79,93,110,156,167").split(",").map(Number))]
  : Array.from({ length: frameCount }, (_, i) => i);

function page(theme) {
  return `<!doctype html><meta charset="utf-8"><style>
    html, body { margin: 0 } #host { width: 1920px; height: 1080px }
    </style><div id="host"></div><script type="module">
    const post = async (route, body) => {
      const response = await fetch(route, { method: "POST", body });
      if (!response.ok) throw new Error(route + ": HTTP " + response.status);
    };
    try {
      const { createTitleFrame } = await import("./frame.js");
      const getFrame = async (role, index) => {
        const response = await fetch("./" + role + "/" + String(index).padStart(3, "0") + ".png");
        if (!response.ok) throw new Error("Missing " + role + " frame " + index);
        return createImageBitmap(await response.blob());
      };
      const draw = await createTitleFrame(document.getElementById("host"), ${JSON.stringify(theme)}, getFrame);
      for (const index of ${JSON.stringify(frames)}) {
        const png = await draw(index);
        if (!png.startsWith("data:image/png;base64,")) throw new Error("Expected a PNG at frame " + index);
        await post("./output/" + index, await (await fetch(png)).blob());
      }
      await post("./done", "");
    } catch (error) { await post("./error", error.stack || String(error)); }
    </script>`;
}

async function renderFrames(theme, folder) {
  const prefix = "/" + randomUUID() + "/";
  let received = 0;
  let resolveRender, rejectRender;
  const finished = new Promise((resolve, reject) => { resolveRender = resolve; rejectRender = reject; });
  let timeout;
  function watchdog() {
    clearTimeout(timeout);
    timeout = setTimeout(() => rejectRender(new Error("Chrome stopped responding at frame " + frames[received])), 90000);
  }
  const server = createServer(async (req, res) => {
    try {
      if (!req.url.startsWith(prefix)) { res.writeHead(404).end(); return; }
      const route = req.url.slice(prefix.length);
      if (req.method === "GET" && route === "") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(page(theme));
      } else if (req.method === "GET" && route === "frame.js") {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        await pipeline(createReadStream(path.join(scratch, "bundle/frame.js")), res);
      } else if (req.method === "GET" && /^(cover|controls|hidden)\/\d{3}\.png$/.test(route)) {
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
        await pipeline(createReadStream(path.join(folder, route)), res);
      } else if (req.method === "POST" && route === "output/" + frames[received] && received < frames.length) {
        await pipeline(req, createWriteStream(path.join(folder, "output", frameName(frames[received]))));
        received++;
        if (received % 24 === 0) console.log(`${theme}: ${received}/${frames.length} frames`);
        watchdog();
        res.writeHead(204).end();
      } else if (req.method === "POST" && route === "done" && received === frames.length) {
        res.writeHead(204).end();
        resolveRender();
      } else if (req.method === "POST" && route === "error") {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        res.writeHead(204).end();
        rejectRender(new Error(Buffer.concat(chunks).toString()));
      } else {
        res.writeHead(404).end();
      }
    } catch (error) {
      res.destroy();
      rejectRender(error);
    }
  });
  let chrome;
  try {
    const port = await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve(server.address().port));
    });
    const executable = process.env.CHROME_BIN ?? (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");
    chrome = spawn(executable, [
      "--headless", "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
      "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--force-device-scale-factor=1",
      "--window-size=1920,1080", "--user-data-dir=" + path.join(folder, "chrome"),
      `http://127.0.0.1:${port}${prefix}`,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let diagnostic = "";
    chrome.stderr.on("data", chunk => { diagnostic = (diagnostic + chunk).slice(-2500); });
    chrome.once("error", rejectRender);
    chrome.once("exit", code => rejectRender(new Error(`Chrome exited (${code}). ${diagnostic}`)));
    watchdog();
    await finished;
  } finally {
    clearTimeout(timeout);
    if (chrome && chrome.exitCode === null && chrome.pid) {
      const exited = new Promise(resolve => chrome.once("close", resolve));
      chrome.kill();
      await exited;
    }
    server.close();
    server.closeAllConnections();
  }
}

async function exportTheme(theme) {
  const folder = path.join(scratch, theme);
  const captures = {
    cover: `cosmos-duo-folded-portrait-${theme}-ko.mp4`,
    controls: `cosmos-duo-open-landscape-${theme}-controls-ko.mp4`,
    hidden: `cosmos-duo-open-landscape-${theme}-hidden-ko.mp4`,
  };
  await mkdir(path.join(folder, "output"), { recursive: true });
  console.log(`${theme}: decoding the device captures`);
  for (const [role, file] of Object.entries(captures)) {
    const sourceDir = path.join(folder, role);
    await mkdir(sourceDir);
    await runCommand("ffmpeg", ["-v", "error", "-i", path.join(assets, "captures", file),
      "-map", "0:v:0", "-fps_mode", "passthrough", "-c:v", "png", "-compression_level", "1",
      "-threads", "2", "-start_number", "0", path.join(sourceDir, "%03d.png")]);
  }
  await renderFrames(theme, folder);
  if (preview) {
    await mkdir(preview, { recursive: true });
    for (const index of frames) {
      await copyFile(path.join(folder, "output", frameName(index)), path.join(preview, theme + "-" + frameName(index)));
    }
  } else {
    const destination = path.join(assets, "media", `cosmos-duo-title-${theme}.mp4`);
    const staging = path.join(path.dirname(destination), "." + randomUUID() + ".mp4");
    try {
      await runCommand("ffmpeg", ["-v", "error", "-framerate", String(fps), "-start_number", "0",
        "-i", path.join(folder, "output/%03d.png"), "-map", "0:v:0", "-an",
        "-c:v", "libx264", "-preset", "medium", "-crf", "15",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-color_range", "tv",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-metadata", `title=zeroPL Duo (${theme}) | Cosmos Laundromat 02:29–02:36`,
        "-metadata", "copyright=(CC) Blender Foundation | gooseberry.blender.org | CC BY 3.0",
        "-movflags", "+faststart", staging]);
      const { stdout } = await runCommand("ffprobe", ["-v", "error", "-of", "json", "-show_streams", staging]);
      const { streams } = JSON.parse(stdout);
      const [video] = streams;
      if (streams.length !== 1 || video.codec_name !== "h264" || video.width !== 1920 ||
          video.height !== 1080 || video.r_frame_rate !== "24/1" ||
          Number(video.nb_frames) !== frameCount || Number(video.duration) !== frameCount / fps) {
        throw new Error("Expected one silent 1920×1080 H.264 video at 24 fps for seven seconds");
      }
      await rename(staging, destination);
      console.log(destination);
    } finally {
      await rm(staging, { force: true });
    }
  }
  await rm(folder, { recursive: true, force: true, maxRetries: 3 });
}

try {
  if (themes.some(theme => !["light", "dark"].includes(theme)) || new Set(themes).size !== themes.length ||
      (!preview && values.frames) || frames.some(i => !Number.isInteger(i) || i < 0 || i >= frameCount)) {
    throw new Error("Use [light|dark] [--preview-dir PATH [--frames 0,36,79,110,167]]");
  }
  await build({
    configFile: false, root, publicDir: false, logLevel: "warn",
    build: {
      outDir: path.join(scratch, "bundle"), emptyOutDir: true, target: "esnext", minify: false,
      lib: { entry: path.join(directory, "frame.ts"), formats: ["es"], fileName: () => "frame.js" },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  for (const theme of themes) await exportTheme(theme);
} finally {
  await rm(scratch, { recursive: true, force: true, maxRetries: 3 });
}
