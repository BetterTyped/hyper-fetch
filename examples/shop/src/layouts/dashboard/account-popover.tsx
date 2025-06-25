import { useCallback } from "react";
import { Box, Divider, MenuItem, MenuList, Popover, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const AccountPopover = (props: { anchorEl: HTMLElement | null; onClose: () => void; open: boolean }) => {
  const { anchorEl, onClose, open } = props;
  const navigate = useNavigate();

  const handleSignOut = useCallback(() => {
    onClose?.();
    // auth.signOut();
    // navigate({ to: "login", replace: true });
  }, [onClose]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: 250 } } }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2,
        }}
      >
        <Typography variant="overline">Account</Typography>
        <Typography color="text.secondary" variant="body1" sx={{ fontSize: 16 }}>
          Anna Kowalska
        </Typography>
      </Box>
      <Divider />
      <MenuList
        disablePadding
        dense
        sx={{
          p: "8px",
          "& > *": {
            borderRadius: 1,
          },
        }}
      >
        <MenuItem sx={{ fontSize: 16 }} onClick={handleSignOut}>
          Sign out
        </MenuItem>
      </MenuList>
    </Popover>
  );
};
