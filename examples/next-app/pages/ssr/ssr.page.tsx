"use client";

import React, { useState } from "react";
import { Time, serialize } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { Stack, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { Viewer } from "../../components/viewer";
import { Request } from "../../components/request";
import { getUser } from "../../api";

const refreshTime = Time.SEC * 10;
const initialDate = +new Date();

export async function getStaticProps() {
  const userRequest = getUser.setParams({ userId: 1 });
  const data = await userRequest.exec({});
  return {
    props: {
      fallbacks: [serialize(userRequest, data)],
    },
  };
}

export const SsrPage: React.FC = (props) => {
  const [dep, setDep] = useState(initialDate);
  const [disabled, setDisabled] = useState(true);

  const result = useFetch(getUser.setParams({ userId: 1 }), {
    disabled,
    dependencies: [dep],
    refresh: true,
    refreshTime,
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
