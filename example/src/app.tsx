import React, { useEffect } from "react";
import { useFetch } from "@better-typed/react-fetch";

import { getUsers, postUser, patchUser, deleteUser } from "./server/user.api";

export const App: React.FC = () => {
  // useEffect(() => {
  //   getUsers.fetch();
  //   getUsers.setQueryParams("?test").fetch();
  //   postUser.setData({ email: "" }).fetch();
  //   patchUser.setParams({ userId: "2" }).setData({ email: "" }).fetch();
  //   deleteUser.setParams({ userId: "1" }).fetch();
  // });

  // console.log(useFetch);
  useFetch(getUsers as any);

  // const values = useFetch(getUsers as any);

  return <div>React Fetch test</div>;
};
