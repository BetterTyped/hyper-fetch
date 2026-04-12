import http from "http";
import type { GraphQLSchema } from "graphql";
import { graphql, buildSchema } from "graphql";

export type GraphQLServerOptions = {
  typeDefs: string;
  resolvers: Record<string, (...args: any[]) => any>;
  delay?: number;
};

/**
 * Lightweight real GraphQL HTTP server for E2E testing.
 *
 * Spins up an actual `http.createServer` that handles
 * POST (JSON body) and GET (query-string) GraphQL requests,
 * just like a production server would.
 */
export const createE2EGraphQLServer = (options: GraphQLServerOptions) => {
  let server: http.Server | null = null;
  let port = 0;

  const schema: GraphQLSchema = buildSchema(options.typeDefs);
  const rootValue = options.resolvers;

  const collectBody = (req: http.IncomingMessage): Promise<string> => {
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => chunks.push(chunk));
      req.on("end", () => resolve(chunks.join("")));
      req.on("error", reject);
    });
  };

  const handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    let query: string | undefined;
    let variables: Record<string, any> | undefined;
    let operationName: string | undefined;

    try {
      if (req.method === "POST") {
        const body = await collectBody(req);
        const parsed = JSON.parse(body);
        query = parsed.query;
        variables = parsed.variables;
        operationName = parsed.operationName;
      } else if (req.method === "GET") {
        const url = new URL(req.url || "/", `http://localhost`);
        query = url.searchParams.get("query") || undefined;
        const varsStr = url.searchParams.get("variables");
        variables = varsStr ? JSON.parse(varsStr) : undefined;
        operationName = url.searchParams.get("operationName") || undefined;
      }

      if (!query) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: "Missing query" }] }));
        return;
      }

      const result = await graphql({
        schema,
        source: query,
        rootValue,
        variableValues: variables,
        operationName,
      });

      if (options.delay) {
        await new Promise<void>((r) => {
          setTimeout(r, options.delay);
        });
      }

      const responseBody = JSON.stringify(result);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(responseBody).toString(),
      });
      res.end(responseBody);
    } catch (err: any) {
      const errorBody = JSON.stringify({ errors: [{ message: err.message }] });
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(errorBody).toString(),
      });
      res.end(errorBody);
    }
  };

  const startServer = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      server = http.createServer(handleRequest);

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

  return { startServer, stopServer, getUrl };
};
