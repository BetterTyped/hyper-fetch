import React from "react";

import { getUser } from "../../api";
import { ClientComponents } from "./client-component";

export const ServerComponents = async () => {
  const request = getUser.setParams({ userId: 1 });
  const response = await request.exec({});

  // Only the plain data crosses to the client component - the client instance stays on each side
  return <ClientComponents hydration={[request.dehydrate({ response })]} />;
};
