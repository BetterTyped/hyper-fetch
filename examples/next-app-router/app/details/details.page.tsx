"use client";

import React, { useState } from "react";
import Countdown from "react-countdown";
import { Time } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { Stack, Button, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { Viewer } from "../../components/viewer";
import { Request } from "../../components/request";
import { getUser } from "../../api";

const refreshTime = Time.SEC * 10;
const initialDate = +new Date();

export const DetailsPage: React.FC = () => {
  const [dep, setDep] = useState(initialDate);
  const [disabled, setDisabled] = useState(true);

  const result = useFetch(getUser.setQueryParams({ date: dep }), {
    disabled,
    dependencies: [dep],
    refresh: true,
    refreshTime,
    revalidate: false,
  });

  const { refetch, timestamp } = result;

  return (
    <Viewer name="Details">
      <Request name="Get one" result={result}>
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
      <Typography>
        <b>Refresh in:</b>{" "}
        <Countdown
          date={timestamp ? +timestamp + refreshTime : Date.now() + refreshTime}
          key={String(timestamp?.getTime())}
        />
      </Typography>
    </Viewer>
  );
};
