import http from "http";

export type RouteHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: Buffer,
  params: Record<string, string>,
) => void | Promise<void>;

export type RouteEntry = {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
};

/**
 * Lightweight real HTTP server for E2E testing.
 *
 * Spins up an actual `http.createServer` on a random available port.
 * Register routes with `.route()`, then use `.url` as the Client base URL.
 */
export const createE2EServer = () => {
  let server: http.Server | null = null;
  let port = 0;

  const routes: RouteEntry[] = [];

  const pathToRegex = (path: string): { pattern: RegExp; paramNames: string[] } => {
    const paramNames: string[] = [];
    const regexStr = path.replace(/:([^/]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });
    return { pattern: new RegExp(`^${regexStr}$`), paramNames };
  };

  const route = (method: string, path: string, handler: RouteHandler) => {
    const { pattern, paramNames } = pathToRegex(path);
    routes.push({ method: method.toUpperCase(), pattern, paramNames, handler });
  };

  const findRoute = (
    method: string,
    pathname: string,
  ): { handler: RouteHandler; params: Record<string, string> } | null => {
    let found: { handler: RouteHandler; params: Record<string, string> } | null = null;

    routes.some((entry) => {
      if (entry.method !== method.toUpperCase()) return false;
      const match = pathname.match(entry.pattern);
      if (match) {
        const params: Record<string, string> = {};
        entry.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        found = { handler: entry.handler, params };
        return true;
      }
      return false;
    });

    return found;
  };

  const collectBody = (req: http.IncomingMessage): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
  };

  const startServer = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      server = http.createServer(async (req, res) => {
        const url = new URL(req.url || "/", `http://localhost`);
        const method = req.method || "GET";
        const result = findRoute(method, url.pathname);

        if (!result) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Not Found" }));
          return;
        }

        try {
          const body = await collectBody(req);
          await result.handler(req, res, body, result.params);
        } catch (err: any) {
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
          }
          res.end(JSON.stringify({ message: err.message }));
        }
      });

      server.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        if (addr && typeof addr === "object") {
          port = addr.port;
          resolve(`http://127.0.0.1:${port}`);
        } else {
          reject(new Error("Failed to get server address"));
        }
      });

      server.on("error", reject);
    });
  };

  const stopServer = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }
      server.close((err) => {
        server = null;
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const getUrl = () => `http://127.0.0.1:${port}`;

  return {
    route,
    startServer,
    stopServer,
    getUrl,
  };
};

// --- Reusable route handlers ---

export const jsonHandler = (data: unknown, status = 200): RouteHandler => {
  return (_req, res) => {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
    });
    res.end(body);
  };
};

export const echoHandler: RouteHandler = (req, res, body) => {
  let responseData: any;
  try {
    responseData = JSON.parse(body.toString());
  } catch {
    responseData = body.toString();
  }

  const responseBody = JSON.stringify({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: responseData,
  });

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(responseBody).toString(),
  });
  res.end(responseBody);
};

export const delayHandler = (ms: number, data: unknown, status = 200): RouteHandler => {
  return (_req, res) => {
    setTimeout(() => {
      const body = JSON.stringify(data);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body).toString(),
      });
      res.end(body);
    }, ms);
  };
};

export const redirectHandler = (targetPath: string, statusCode: 301 | 302 | 307 | 308 = 302): RouteHandler => {
  return (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const target = `${url.protocol}//${url.host}${targetPath}`;
    res.writeHead(statusCode, { Location: target });
    res.end();
  };
};

export const streamHandler = (chunks: string[], intervalMs = 50): RouteHandler => {
  return (_req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    });

    let i = 0;
    const send = () => {
      if (i < chunks.length) {
        res.write(chunks[i]);
        i += 1;
        setTimeout(send, intervalMs);
      } else {
        res.end();
      }
    };
    send();
  };
};

export const fileDownloadHandler = (
  content: Buffer,
  filename: string,
  contentType = "application/octet-stream",
): RouteHandler => {
  return (_req, res) => {
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": content.length.toString(),
    });
    res.end(content);
  };
};

export const statusHandler = (status: number, body?: unknown): RouteHandler => {
  return (_req, res) => {
    const responseBody = body !== undefined ? JSON.stringify(body) : "";
    res.writeHead(status, {
      "Content-Type": "application/json",
      ...(responseBody ? { "Content-Length": Buffer.byteLength(responseBody).toString() } : {}),
    });
    res.end(responseBody);
  };
};

export const headHandler = (headers: Record<string, string> = {}): RouteHandler => {
  return (_req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": "0",
      ...headers,
    });
    res.end();
  };
};
