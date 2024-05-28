import React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";

import { routing } from "../constants/routing.constants";

const drawerWidth = 240;

export const Sidebar = ({ children }: { children: React.ReactNode | undefined | null }) => {
  const { navigate } = routing.useLocation();
  const links = Object.entries(routing.routing.routes);

  return (
    <Box sx={{ display: "flex" }}>
      <Box
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          height: "100%",
        }}
      >
        <List>
          {links.map(([name, route]) => (
            <ListItem disablePadding key={route.path}>
              <ListItemButton onClick={() => navigate({ href: route.path })}>
                <ListItemText primary={name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      {children}
    </Box>
  );
};
