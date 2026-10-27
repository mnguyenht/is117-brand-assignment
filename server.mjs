import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createDevelopmentReload } from "./dev-reload.mjs";

const publicDirectory = path.resolve(
  fileURLToPath(new URL("./public/", import.meta.url)),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
};

// Local server only. GitHub Pages serves the unchanged public/ files.
export function createApp({
  development = false,
  publicRoot = publicDirectory,
} = {}) {
  const reload = development ? createDevelopmentReload(publicRoot) : undefined;
  const app = createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("This demo serves files; it does not accept orders.");
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (reload?.handle(pathname, request, response)) return;
      const segments = pathname.split("/");
      if (
        segments.some((segment) => segment.startsWith(".")) ||
        pathname.includes("\\") ||
        pathname.includes("\0")
      ) {
        response.writeHead(404);
        response.end("File not found");
        return;
      }
      const filename = path.resolve(
        publicRoot,
        `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`,
      );
      const resolvedRoot = await realpath(publicRoot);
      const resolvedFile = await realpath(filename);
      if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
        response.writeHead(404);
        response.end("File not found");
        return;
      }
      const content = await readFile(resolvedFile);
      const servedContent =
        reload && path.extname(filename) === ".html"
          ? reload.inject(content)
          : content;
      response.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : servedContent);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404);
      response.end(
        error instanceof URIError ? "Invalid file path" : "File not found",
      );
    }
  });
  app.on("close", () => reload?.close());
  return app;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT ?? 5173);
  const host = process.env.HOST ?? "127.0.0.1";
  const development = process.argv.includes("--dev");
  const app = createApp({ development });
  app.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop the other preview or choose another PORT.`,
      );
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  });
  app.listen(port, host, () => {
    console.log(`Brand studio: http://${host}:${port}`);
    console.log(
      development
        ? "Development mode: save public/ files to refresh the browser automatically."
        : "Plain preview mode: refresh the browser yourself after saving files.",
    );
    console.log(
      "Press Ctrl+C to stop. Local changes do not publish to GitHub Pages.",
    );
  });
}
