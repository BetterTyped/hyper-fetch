import React, { useState } from "react";
import { useFetch } from "@better-typed/react-fetch";

import { getUser } from "../server/user.api";

export const UserDetails: React.FC = () => {
  const [fetched, setFetched] = useState(false);

  const { data, loading, error } = useFetch(
    getUser.onRequestStart(() => {
      setFetched(true);
    }),
  );

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
