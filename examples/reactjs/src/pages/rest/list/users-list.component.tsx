import React, { useState } from "react";
import { useFetch, DateInterval, FetchCommand, ClientQueryParamsType } from "@better-typed/react-fetch";

import { getUsers } from "../server/user.api";
import { UserModel } from "../../../models";

const refreshTime = DateInterval.second * 10;

export const UsersList: React.FC = () => {
  const [fetched, setFetched] = useState(false);

  const { data, loading, error, onRequestStart } = useFetch(
    getUsers as FetchCommand<
      UserModel[],
      undefined,
      ClientQueryParamsType,
      Error,
      "/api/users",
      Partial<XMLHttpRequest>,
      false,
      false,
      false
    >,
    {
      refresh: true,
      refreshTime,
      cacheOnMount: false,
      initialData: [
        [
          {
            id: 12,
            name: "test",
            email: "test",
            age: 12,
          },
        ],
        null,
        200,
      ],
    },
  );

  onRequestStart(() => {
    setFetched(true);
  });

  return (
    <div>
      <h3>User Request Details:</h3>
      <div>initially fetched: {String(fetched)}</div>
      <div>loading: {String(loading)}</div>
      <div>error: {JSON.stringify(error)}</div>
      <div>data: {JSON.stringify(data)}</div>
    </div>
  );
};
