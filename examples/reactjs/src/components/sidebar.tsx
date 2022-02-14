import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

import { DASHBOARD_PAGE, DETAILS_PAGE, FORM_PAGE, LIST_PAGE } from "constants/routing.constants";

const links = [DETAILS_PAGE, LIST_PAGE, FORM_PAGE];
const drawerWidth = 240;

export const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="mailbox folders">
      <Drawer
        open
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate(DASHBOARD_PAGE.path)}>
            <Typography variant="h6" sx={{ fontWeight: "800" }}>
              React Examples
            </Typography>
          </ListItemButton>
        </ListItem>
        <Divider />
        <List>
          {links.map((link) => (
            <ListItem disablePadding key={link.path}>
              <ListItemButton onClick={() => navigate(link.path)}>
                <ListItemText primary={link.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};
