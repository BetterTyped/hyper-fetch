"use client";

import { Time } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import { Stack, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";

import { getUser } from "../../api";
import { Request } from "../../components/request";
import { Viewer } from "../../components/viewer";

const refreshTime = Time.SEC * 10;
const initialDate = +new Date();

export async function getStaticProps() {
  const userRequest = getUser.setParams({ userId: 1 });
  const response = await userRequest.exec({});
  return {
    props: {
      fallbacks: [userRequest.dehydrate({ response })],
    },
  };
}

export const SsrPage: React.FC = () => {
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
export default SsrPage;
