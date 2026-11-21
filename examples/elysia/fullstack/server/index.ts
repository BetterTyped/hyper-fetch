import { app } from "./app";

// `npm run dev` starts the server through vite.config.ts. This entry runs it on its own, as in production.
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => console.log(`Elysia API on http://localhost:${port}/api`));
