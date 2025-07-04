"use client";

import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { useFetch } from "@hyper-fetch/react";
import TextField from "@mui/material/TextField";
import { Button, IconButton, Stack } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getUsers } from "../../api";
import { Request } from "../../components/request";
import { Viewer } from "../../components/viewer";

const initialDate = +new Date();

export const ListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [dep, setDep] = useState(initialDate);

  const result = useFetch(getUsers.setQueryParams({ page, search } as any), {
    refresh: false,
    initialData: { data: [[], null, 200] },
    bounce: true,
    bounceTime: 600,
    dependencies: [search, dep],
  });

  const onPageChange = (_event: React.ChangeEvent<unknown>, selectedPage: number) => {
    setPage(selectedPage);
  };

  const { refetch } = result;

  return (
    <Viewer name="List">
      <Request name="Get many" result={result}>
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 3 }}
        />
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={() => setDep(+new Date())}>
            Change dependency
          </Button>
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Request>
      <Pagination page={page} count={10} shape="rounded" onChange={onPageChange} />
    </Viewer>
  );
};
