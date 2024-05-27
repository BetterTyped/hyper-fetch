"use server";

import React from "react";

import { getUser } from "../../api";
import { ClientComponents } from "./client-component";

export const ServerComponents: React.FC = async () => {
  const fallback = await getUser.setParams({ userId: 1 }).exec({});

  return <ClientComponents fallback={fallback} />;
};
