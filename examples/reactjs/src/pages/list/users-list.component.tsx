import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { useFetch } from "@better-typed/react-hyper-fetch";

import { getUsers } from "../server/user.api";

export const UsersList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [fetched, setFetched] = useState(false);

  const { data, loading, error, onRequestStart } = useFetch(getUsers.setQueryParams({ page }), {
    refresh: false,
    // cacheOnMount: false,
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
  });

  onRequestStart(() => {
    setFetched(true);
  });

  const onPageChange = (_event: React.ChangeEvent<unknown>, selectedPage: number) => {
    setPage(selectedPage);
  };

  return (
    <div>
      <div>
        <b>initially fetched:</b> {String(fetched)}
      </div>
      <div>
        <b>loading:</b> {String(loading)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(error)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(data)}
      </div>
      <Pagination page={page} count={10} shape="rounded" onChange={onPageChange} />
    </div>
  );
};
