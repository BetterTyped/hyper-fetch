"use client";

import React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useRouter } from "next/navigation";

import { DETAILS_PAGE, FORM_PAGE, LIST_PAGE, SSR_PAGE } from "../constants/routing.constants";

const links = [SSR_PAGE, DETAILS_PAGE, LIST_PAGE, FORM_PAGE];
const drawerWidth = 240;

export const Sidebar = ({ children }: { children: React.ReactNode | undefined | null }) => {
  const { push } = useRouter();

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
              <ListItemButton onClick={() => push(link.path)}>
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
