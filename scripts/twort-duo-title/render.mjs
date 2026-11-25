// Run with npm ci, Chrome, FFmpeg and ImageMagick. CHROME_BIN overrides the browser path.
// node scripts/twort-duo-title/render.mjs [--stills DIRECTORY]
import { execFile, spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, link, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { parseArgs, promisify } from "node:util";
import { build } from "vite";
import { coverPage } from "./cover.mjs";

const run = promisify(execFile);
const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, "../..");
const scratch = await mkdtemp(join(tmpdir(), "twort-duo-title-"));
const site = join(scratch, "site");
const { values: { stills } } = parseArgs({ options: { stills: { type: "string" } } });
const frameName = index => String(index).padStart(3, "0") + ".png";
const chromePath = process.env.CHROME_BIN ?? (process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");

function monitorPage(product, dark) {
  const source = JSON.stringify(product).replaceAll("<", "\\u003c");
  return `<!doctype html><meta charset="utf-8"><body><script>
    const product = new DOMParser().parseFromString(${source}, "text/html");
    document.documentElement.lang = product.documentElement.lang;
    const figure = product.querySelector("#displays .display-demo");
    const mode = figure.querySelector('input[value="extend"]');
    const stage = figure.querySelector(".stage");
    const devices = stage.querySelector(".devices");
    const monitor = devices.querySelector(".external-device");
    monitor.querySelector(".device-name").remove();
    devices.replaceChildren(monitor);
    figure.replaceChildren(mode, stage);

    // Use the product page's CSS and markup at a size suitable for compositing.
    for (const style of product.head.querySelectorAll('style, link[rel="stylesheet"][href^="/_astro/"]')) {
      document.head.append(style);
    }
    Object.assign(document.documentElement.style, { background: "transparent", overflow: "hidden" });
    Object.assign(figure.style, { maxWidth: "none", margin: "28px" });
    Object.assign(stage.style, { width: "2000px", margin: "0" });
    Object.assign(devices.style, { gridTemplateColumns: "var(--monitor-width)", justifyContent: "start" });
    monitor.querySelector(".desktop").style.colorScheme = ${JSON.stringify(dark ? "dark" : "light")};
    document.body.append(figure);

    window.addEventListener("load", () => {
      const shell = monitor.querySelector(".monitor-shell").getBoundingClientRect();
      const screen = monitor.querySelector(".monitor-screen").getBoundingClientRect();
      const stand = monitor.querySelector(".monitor-stand").getBoundingClientRect();
      fetch("/monitor-layout", {
        method: "POST",
        body: JSON.stringify({
          left: shell.left, width: shell.width, bottom: stand.bottom,
          screenWidth: screen.width, screenHeight: screen.height,
        }),
      });
    });
  </script>`;
}

function page(lang, dark, monitorLayout) {
  return `<!doctype html><meta charset="utf-8"><div id="host"></div><script type="module">
    import { createTitleFrame, poseFrame, fps, frameCount, width, height } from "./frame.js";
    const host = document.getElementById("host");
    Object.assign(host.style, { width: width + "px", height: height + "px" });
    async function post(path, body) {
      const result = await fetch(path, { method: "POST", body });
      if (!result.ok) throw new Error(path + " returned " + result.status);
    }
    try {
      const draw = await createTitleFrame(host, ${JSON.stringify(lang)}, ${dark}, ${JSON.stringify(monitorLayout)});
      const frames = ${stills ? "[0, 40, 52, 55, 56, 98, 114]" : "Array.from({ length: frameCount }, (_, frame) => poseFrame(frame))"};
      for (const frame of new Set(frames)) {
        const png = await new Promise(resolve => draw(frame).toBlob(resolve));
        if (!png) throw new Error("Could not capture frame " + frame);
        await post("./frame/" + frame, png);
      }
      await post("./complete", JSON.stringify({ fps, frames }));
    } catch (error) {
      await post("./error", error.stack || String(error));
    }
  </script>`;
}

async function capture(folder, lang, dark) {
  const monitorMarkup = monitorPage(await readFile(join(site, lang, "twort/index.html"), "utf8"), dark);
  const coverMarkup = coverPage(lang, dark);
  let monitorLayout;
  let resolveCapture, rejectCapture;
  const finished = new Promise((resolve, reject) => {
    resolveCapture = resolve;
    rejectCapture = reject;
  });
  const asset = /^\/twort\/(?:chalk-coast\.webp|coast-study\.webp|duo\/(?:ko\/)?open-landscape(?:-dark)?\.webp)$/;
  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(page(lang, dark, monitorLayout));
      } else if (req.method === "GET" && req.url === "/monitor") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(monitorMarkup);
      } else if (req.method === "GET" && req.url === "/cover") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(coverMarkup);
      } else if (req.method === "GET" && (req.url === "/monitor.png" || req.url === "/cover.png")) {
        res.writeHead(200, { "Content-Type": "image/png" });
        await pipeline(createReadStream(join(folder, req.url)), res);
      } else if (req.method === "GET" && /^\/_astro\/[\w.-]+\.css$/.test(req.url)) {
        res.writeHead(200, { "Content-Type": "text/css" });
        await pipeline(createReadStream(join(site, req.url)), res);
      } else if (req.method === "GET" && req.url === "/frame.js") {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        await pipeline(createReadStream(join(scratch, "bundle/frame.js")), res);
      } else if (req.method === "GET" && asset.test(req.url)) {
        res.writeHead(200, { "Content-Type": "image/webp" });
        await pipeline(createReadStream(join(root, "public", req.url)), res);
      } else if (req.method === "POST" && /^\/frame\/\d+$/.test(req.url)) {
        const frame = Number(req.url.slice("/frame/".length));
        await pipeline(req, createWriteStream(join(folder, frameName(frame))));
        res.writeHead(204).end();
      } else if (req.method === "POST" && ["/complete", "/error", "/monitor-layout"].includes(req.url)) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const content = Buffer.concat(chunks).toString();
        res.writeHead(204).end();
        if (req.url === "/monitor-layout") monitorLayout = JSON.parse(content);
        else if (req.url === "/error") rejectCapture(new Error(content));
        else resolveCapture(JSON.parse(content));
      } else {
        res.writeHead(404).end();
      }
    } catch (error) {
      res.destroy();
      rejectCapture(error);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chromeOptions = ["--headless", "--no-first-run", "--no-default-browser-check", "--disable-background-networking"];
  const screenshot = (name, size) => run(chromePath, [
    ...chromeOptions, `--window-size=${size}`, "--force-device-scale-factor=1",
    "--default-background-color=00000000", "--run-all-compositor-stages-before-draw", "--virtual-time-budget=2000",
    `--screenshot=${join(folder, name + ".png")}`, `--user-data-dir=${join(folder, name + "-chrome")}`,
    `${origin}/${name}`,
  ], { timeout: 25_000 });
  let chrome, timeout;
  try {
    await screenshot("monitor", "1120,820");
    if (!monitorLayout?.screenWidth || !monitorLayout.screenHeight) {
      throw new Error("Could not measure the extended display demo's monitor");
    }
    await screenshot("cover", "704,1024");

    chrome = spawn(chromePath, [
      ...chromeOptions, "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
      "--force-device-scale-factor=2", `--user-data-dir=${join(folder, "chrome")}`, origin + "/",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let diagnostic = "";
    chrome.stderr.on("data", chunk => { diagnostic = (diagnostic + chunk).slice(-2600); });
    chrome.once("error", rejectCapture);
    chrome.once("exit", code => rejectCapture(new Error(`Chrome exited (${code}). ${diagnostic}`)));
    timeout = setTimeout(() => rejectCapture(new Error("Chrome did not finish rendering")), 180_000);
    return await finished;
  } finally {
    clearTimeout(timeout);
    if (chrome?.exitCode === null && chrome.pid) {
      const closed = new Promise(resolve => chrome.once("close", resolve));
      chrome.kill();
      await closed;
    }
    server.close();
    server.closeAllConnections();
  }
}

async function exportVideo(folder, output, { fps, frames }) {
  const sequence = join(folder, "sequence");
  await mkdir(sequence);
  await Promise.all(frames.map((frame, index) => link(join(folder, frameName(frame)), join(sequence, frameName(index)))));
  await run("ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-i", join(sequence, "%03d.png"),
    "-an", "-c:v", "libx264", "-threads", "4", "-preset", "medium", "-crf", "19",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-color_range", "tv",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-movflags", "+faststart", output + ".mp4"]);
  await run("magick", [join(folder, frameName(0)), "-strip", "-quality", "86", output + ".webp"]);
}

try {
  await run(process.execPath, [join(root, "node_modules/astro/astro.js"), "build", "--outDir", site], { cwd: root });
  await build({
    configFile: false, root, publicDir: false, logLevel: "warn",
    build: {
      outDir: join(scratch, "bundle"), emptyOutDir: false, target: "esnext",
      lib: { entry: join(directory, "frame.ts"), formats: ["es"], fileName: () => "frame.js" },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const destination = stills ? resolve(stills) : join(root, "public/twort/media");
  await mkdir(destination, { recursive: true });
  for (const lang of ["ko", "en"]) {
    for (const appearance of ["light", "dark"]) {
      const name = `duo-workspace-${lang}-${appearance}`;
      const folder = join(scratch, name);
      await mkdir(folder);
      console.log(`Rendering ${name}`);
      const recording = await capture(folder, lang, appearance === "dark");
      if (stills) {
        await Promise.all(recording.frames.map(frame =>
          copyFile(join(folder, frameName(frame)), join(destination, name + "-" + frameName(frame)))));
      } else {
        await exportVideo(folder, join(destination, name), recording);
      }
      await rm(folder, { recursive: true, force: true, maxRetries: 3 });
    }
  }
} finally {
  await rm(scratch, { recursive: true, force: true, maxRetries: 3 });
}
