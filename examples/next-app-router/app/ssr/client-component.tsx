"use client";

import { Hydrate, useFetch } from "@hyper-fetch/react";
import type { HydrateProps } from "@hyper-fetch/react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import { Stack, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";

import { client, getUser } from "../../api";
import { Request } from "../../components/request";
import { Viewer } from "../../components/viewer";

export const ClientComponents: React.FC<{ hydration: HydrateProps["data"] }> = ({ hydration }) => (
  <Hydrate client={client} data={hydration}>
    <HydratedUser />
  </Hydrate>
);

const HydratedUser: React.FC = () => {
  const [dep, setDep] = useState(+new Date());
  const [disabled, setDisabled] = useState(true);

  // Renders the server data on the first render - no loading state and no request while it is fresh
  const result = useFetch(getUser.setParams({ userId: 1 }), {
    disabled,
    dependencies: [dep],
    revalidate: false,
  });

  const { refetch } = result;

  return (
    <Viewer name="Server side rendering">
      <Request name="Hydrated results" result={result}>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={() => setDep(+new Date())}>
            Change dependency
          </Button>
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={() => setDisabled((prev) => !prev)}>
            {disabled ? <PlayArrowIcon /> : <StopIcon />}
          </IconButton>
        </Stack>
      </Request>
    </Viewer>
  );
};
