/* eslint-disable react/require-default-props */
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Stack, Box, Typography, Container, Chip } from "@mui/material";
import { useAppManager } from "@better-typed/react-hyper-fetch";

import { Sidebar } from "components/sidebar";
import { DASHBOARD_PAGE } from "constants/routing.constants";
import { builder } from "api";

export const Viewer: React.FC<{ name: string; children: React.ReactNode; noButtons?: boolean }> = ({
  name,
  children,
  noButtons,
}) => {
  const [mount, setMount] = useState(true);
  const { isOnline, isFocused } = useAppManager(builder);

  const { push } = useRouter();

  const handleToggle = () => {
    setMount((prev) => !prev);
  };

  return (
    <Box>
      <Box sx={{ background: "#eaeaea", pt: "30px", pb: "40px", pl: 3, pr: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: "800" }}>
          {name}
          {!isFocused && <Chip label="Blur" color="primary" />}
          {!isOnline && <Chip label="Offline" color="error" />}
        </Typography>
        {!noButtons && (
          <Stack direction="row" spacing={2}>
            <Box>
              <Button size="small" variant="contained" type="button" onClick={() => push(DASHBOARD_PAGE.path)}>
                Go To dashboard
              </Button>
            </Box>
            <Box>
              <Button
                color={mount ? "success" : "error"}
                size="small"
                variant="contained"
                type="button"
                onClick={handleToggle}
              >
                {mount ? "Unmount" : "Mount"}
              </Button>
            </Box>
          </Stack>
        )}
      </Box>

      {!noButtons && (
        <Sidebar>
          <Container
            sx={{
              pt: 4,
              borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            {mount && children}
          </Container>
        </Sidebar>
      )}
      {noButtons && (
        <Container
          sx={{
            pt: 4,
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          {mount && children}
        </Container>
      )}
    </Box>
  );
};
