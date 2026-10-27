import { watch } from "node:fs";

const scriptPath = "/__dev/reload.js";
const eventsPath = "/__dev/events";
const clientScript = `(() => {
  const changes = new EventSource("${eventsPath}");
  changes.addEventListener("change", () => window.location.reload());
})();`;

export function createDevelopmentReload(publicRoot) {
  const clients = new Set();
  let pending;
  const watcher = watch(
    publicRoot,
    { recursive: true, persistent: false },
    (_event, filename) => {
      if (
        !filename ||
        filename
          .toString()
          .split(/[\\/]/)
          .some((segment) => segment.startsWith("."))
      ) {
        return;
      }
      clearTimeout(pending);
      pending = setTimeout(() => {
        for (const response of clients) {
          response.write("event: change\ndata: saved\n\n");
        }
      }, 100);
      pending.unref();
    },
  );
  watcher.on("error", (error) => {
    console.error(
      `Automatic browser refresh stopped: ${error.message}. Restart npm run dev.`,
    );
  });

  return {
    inject(content) {
      const script = `<script src="${scriptPath}" defer></script>`;
      const html = content.toString("utf8");
      return /<\/head\s*>/i.test(html)
        ? html.replace(/<\/head\s*>/i, `${script}</head>`)
        : `${html}${script}`;
    },
    handle(pathname, request, response) {
      if (![scriptPath, eventsPath].includes(pathname)) return false;
      response.writeHead(200, {
        "Content-Type":
          pathname === scriptPath
            ? "text/javascript; charset=utf-8"
            : "text/event-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      if (request.method === "HEAD") {
        response.end();
      } else if (pathname === scriptPath) {
        response.end(clientScript);
      } else {
        response.write(": connected\n\n");
        clients.add(response);
        request.on("close", () => clients.delete(response));
      }
      return true;
    },
    close() {
      clearTimeout(pending);
      watcher.close();
      for (const response of clients) response.end();
      clients.clear();
    },
  };
}
