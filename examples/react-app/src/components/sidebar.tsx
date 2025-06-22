import React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;

const links = [
  { name: "Dashboard", path: "/" },
  { name: "Details", path: "/details" },
  { name: "List", path: "/list" },
  { name: "Form", path: "/forms" },
  { name: "Websockets", path: "/websockets" },
];

export const Sidebar = ({ children }: { children: React.ReactNode | undefined | null }) => {
  const navigate = useNavigate();

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
          {links.map((link) => (
            <ListItem disablePadding key={link.path}>
              <ListItemButton onClick={() => navigate(link.path)}>
                <ListItemText primary={link.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      {children}
    </Box>
  );
};
