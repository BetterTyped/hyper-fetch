import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { useFetch } from "@better-typed/react-hyper-fetch";
import TextField from "@mui/material/TextField";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ErrorIcon from "@mui/icons-material/Error";
import DataArrayIcon from "@mui/icons-material/DataArray";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { getUsers } from "../server/user.api";

export const UsersList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading, error, timestamp, onRequestStart } = useFetch(getUsers.setQueryParams({ page, search }), {
    refresh: false,
    initialData: [[], null, 200],
    debounce: true,
    debounceTime: 600,
    dependencies: [search],
  });

  onRequestStart(() => {
    setFetched(true);
  });

  const onPageChange = (_event: React.ChangeEvent<unknown>, selectedPage: number) => {
    setPage(selectedPage);
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <TextField label="Search" variant="outlined" value={search} onChange={(event) => setSearch(event.target.value)} />
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
      <Pagination page={page} count={10} shape="rounded" onChange={onPageChange} />
    </div>
  );
};
