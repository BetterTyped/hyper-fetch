import React, { useState } from "react";
import Countdown from "react-countdown";
import { DateInterval } from "@better-typed/hyper-fetch";
import { useFetch } from "@better-typed/react-hyper-fetch";
import { Stack, Button, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";

import { Viewer } from "components/viewer";
import { Request } from "components/request";
import { getUser } from "api";

import RefreshIcon from "@mui/icons-material/Refresh";

const refreshTime = DateInterval.second * 10;
const initialDate = +new Date();

export const DetailsPage: React.FC = () => {
  const [dep, setDep] = useState(initialDate);

  const result = useFetch(getUser.setQueryParams({ date: dep } as any), {
    dependencies: [dep],
    refresh: true,
    refreshTime,
    revalidateOnMount: false,
  });

  const { revalidate, timestamp } = result;

  return (
    <Viewer name="Details">
      <Request name="Get one" result={result}>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={() => setDep(+new Date())}>
            Change dependency
          </Button>
          <IconButton onClick={() => revalidate()}>
            <RefreshIcon />
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
