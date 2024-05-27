"use client";

import React, { useState } from "react";
import { ExtractAdapterReturnType, RequestInstance } from "@hyper-fetch/core";
import { UseFetchRequest, useFetch } from "@hyper-fetch/react";
import { Stack, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { Viewer } from "../../components/viewer";
import { Request } from "../../components/request";
import { getUser } from "../../api";

export const ClientComponents: React.FC<{
  fallback: Partial<ExtractAdapterReturnType<UseFetchRequest<RequestInstance>>>;
}> = (props) => {
  const [dep, setDep] = useState(+new Date());
  const [disabled, setDisabled] = useState(true);

  const result = useFetch(getUser.setParams({ userId: 1 }), {
    disabled,
    dependencies: [dep],
    revalidate: false,
    initialData: props.fallback,
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
