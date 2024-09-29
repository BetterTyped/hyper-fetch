import { UserModel } from "../models";
import { getWord } from "./random.utils";

export const getRandomUser = (): UserModel => {
  const name = getWord();

  return {
    id: Math.round(Math.random() * 10000),
    name,
    email: `${name}@local.local`,
    age: Math.round(Math.random() * 100),
    admin: false,
    permissions: ["read", "write", "delete", "update"],
    nestedValue: {
      otherNestedValue: {
        otherNestedValue2: {
          otherNestedValue3: {
            otherNestedValue4: {
              otherNestedValue5: `Lorem ipsum dolor sit amet consectetur adipisicing elit.`,
            },
          },
        },
      },
    },
  };
};

export const getRandomUsers = (count = 10): UserModel[] => {
  return Array.from(Array(count).keys()).map(getRandomUser);
};
