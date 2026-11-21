import { implement } from "@orpc/server";

import { contract, type Planet } from "./contract";

// In memory, so the data resets when the dev server restarts.
let planets: Planet[] = [
  {
    id: 1,
    name: "Mercury",
    type: "rocky",
    discoveredAt: new Date("1631-11-07"),
  },
  { id: 2, name: "Uranus", type: "ice", discoveredAt: new Date("1781-03-13") },
  { id: 3, name: "Neptune", type: "ice", discoveredAt: new Date("1846-09-23") },
];

const os = implement(contract);

// TypeScript checks every handler against the contract: inputs, outputs and errors.
export const router = os.router({
  planet: {
    list: os.planet.list.handler(() => planets),
    create: os.planet.create.handler(({ input, errors }) => {
      if (planets.some((planet) => planet.name.toLowerCase() === input.name.toLowerCase())) {
        throw errors.CONFLICT({ data: { name: input.name } });
      }
      const planet: Planet = { id: planets.length + 1, ...input };
      planets = [...planets, planet];
      return planet;
    }),
  },
});
