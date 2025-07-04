import React, { useState } from "react";
import Countdown from "react-countdown";
import { Time } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { Stack, Button, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";

import { Viewer } from "../../components/viewer";
import { Request } from "../../components/request";
import { getUser } from "../../api";

const refreshTime = Time.SEC * 10;
const initialDate = +new Date();

export const DetailsPage: React.FC = () => {
  const [dep, setDep] = useState(initialDate);

  const result = useFetch(getUser.setQueryParams({ date: dep } as any), {
    dependencies: [dep],
    refresh: true,
    refreshTime,
    revalidate: false,
  });

  const { refetch, responseTimestamp } = result;

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
        </Stack>
      </Request>
      <Typography>
        <b>Refresh in:</b>{" "}
        <Countdown
          date={responseTimestamp ? +responseTimestamp + refreshTime : Date.now() + refreshTime}
          key={String(responseTimestamp?.getTime())}
        />
      </Typography>
    </Viewer>
  );
};
