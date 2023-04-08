import { Database, set, ref } from "firebase/database";

export type Tea = {
  name: string;
  type: "Green" | "Hong" | "White" | "Puerh" | "Oolong";
  origin: string;
  amount: number;
  year: number;
};

export const teas = [
  { id: 0, name: "Bi Luo Chun", type: "Green", origin: "China", amount: 50, year: 2022 },
  { id: 1, name: "Taiping Hou Kui", type: "Green", origin: "China", amount: 150, year: 2023 },
  { id: 2, name: "Hon.yama Sencha", type: "Green", origin: "Japan", amount: 25, year: 2021 },
  { id: 3, name: "Yunnan Golden Silk", type: "Hong", origin: "China", year: 2022 },
  { id: 4, name: "Hong Yu", type: "Hong", origin: "Taiwan", year: 2023 },
  { id: 5, name: "Ming Jian GABA Oolong", type: "Oolong", origin: "Taiwan", year: 2021 },
  { id: 6, name: "Da hong pao", type: "Oolong", origin: "China", year: 2021 },
  { id: 7, name: "Shou Mei", type: "White", origin: "China", year: 2011 },
  { id: 8, name: "Wild White Tea", type: "White", origin: "China", year: 2017 },
  { id: 9, name: "Sheng HK Red Wild", type: "Puerh", origin: "China", year: 1980 },
];
export const seedRealtimeDatabase = async (db: Database) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tea of teas) {
    const { id, ...data } = tea;
    // eslint-disable-next-line no-await-in-loop
    await set(ref(db, `teas/${id}`), data);
  }
};
