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
  const { data, error, loading } = useFetch(getUsers as any);
  const data2 = useFetch(getUsers as any);
  const data3 = useFetch(getUsers as any);
  const data4 = useFetch(getUsers as any);

  // const values = useFetch(getUsers as any);

  console.log(1, { data, error, loading });
  console.log(2, data2);
  console.log(3, data3);
  console.log(4, data4);

  return (
    <div>
      React Fetch test
      {loading && <div>Loading...</div>}
      {data && <div>HAS DATA!!!</div>}
      {error && <div>Has error!!!</div>}
    </div>
  );
};
