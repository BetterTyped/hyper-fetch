# DB offline outbox

Writes that keep working offline: the outbox persists them, replays them in order when the connection returns and drops
dependents of a rejected write.

- [Read the walkthrough](https://hyperfetch.bettertyped.com/examples/db/offline-outbox)
- [Open in StackBlitz](https://stackblitz.com/github/BetterTyped/hyper-fetch/tree/main/examples/db/offline-outbox)
- [Open in CodeSandbox](https://codesandbox.io/s/github/BetterTyped/hyper-fetch/tree/main/examples/db/offline-outbox)

## Run it locally

```bash
npx tiged BetterTyped/hyper-fetch/examples/db/offline-outbox hyper-fetch-db-offline-outbox
cd hyper-fetch-db-offline-outbox
npm install
npm run dev
```
