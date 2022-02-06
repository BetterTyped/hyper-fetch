import React, { useState } from "react";
import Countdown from "react-countdown";
import { DateInterval } from "@better-typed/hyper-fetch";
import { useFetch } from "@better-typed/react-hyper-fetch";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { Stack, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";

import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import DataArrayIcon from "@mui/icons-material/DataArray";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { getUser } from "../server/user.api";

const refreshTime = DateInterval.second * 10;
const initialDate = +new Date();

export const UserDetails: React.FC = () => {
  const [dep, setDep] = useState(initialDate);
  const [fetched, setFetched] = useState(false);

  const { data, loading, error, refresh, timestamp, onRequestStart } = useFetch(getUser.setQueryParams({ date: dep }), {
    dependencies: [dep],
    refresh: true,
    refreshTime,
    revalidateOnMount: false,
  });

  onRequestStart(() => {
    setFetched(true);
  });

  return (
    <div style={{ marginTop: "30px" }}>
      <Stack direction="row" spacing={1}>
        <IconButton onClick={() => refresh()}>
          <RefreshIcon />
        </IconButton>
        <Button variant="text" onClick={() => setDep(+new Date())}>
          Change dependency
        </Button>
      </Stack>
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <HourglassBottomIcon />
            </ListItemIcon>
            <ListItemText primary="Initially Fetched" sx={{ minWidth: "150px", maxWidth: "150px" }} />
            <Divider orientation="vertical" flexItem sx={{ margin: "0 20px 0 10px" }} />
            <ListItemText secondary={String(fetched)} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <AutorenewIcon />
            </ListItemIcon>
            <ListItemText primary="Loading" sx={{ minWidth: "150px", maxWidth: "150px" }} />
            <Divider orientation="vertical" flexItem sx={{ margin: "0 20px 0 10px" }} />
            <ListItemText primary={loading && String(loading)} secondary={!loading && String(loading)} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ErrorIcon />
            </ListItemIcon>
            <ListItemText primary="Error" sx={{ minWidth: "150px", maxWidth: "150px" }} />
            <Divider orientation="vertical" flexItem sx={{ margin: "0 20px 0 10px" }} />
            <ListItemText secondary={JSON.stringify(error)} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <DataArrayIcon />
            </ListItemIcon>
            <ListItemText primary="Data" sx={{ minWidth: "150px", maxWidth: "150px" }} />
            <Divider orientation="vertical" flexItem sx={{ margin: "0 20px 0 10px" }} />
            <ListItemText secondary={JSON.stringify(data)} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="Timestamp" sx={{ minWidth: "150px", maxWidth: "150px" }} />
            <Divider orientation="vertical" flexItem sx={{ margin: "0 20px 0 10px" }} />
            <ListItemText secondary={`${timestamp?.toDateString()} ${timestamp?.toLocaleTimeString()}`} />
          </ListItemButton>
        </ListItem>
        <Divider />
      </List>
      <div>
        <b>refresh in:</b>{" "}
        <Countdown
          date={timestamp ? +timestamp + refreshTime : Date.now() + refreshTime}
          key={String(timestamp?.getTime())}
        />
      </div>
    </div>
  );
};
