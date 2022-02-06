import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Box } from "@mui/material";

import { DASHBOARD_PAGE } from "constants/routing.constants";
import { Container } from "components/container";
import { UserDetails } from "./user-details.component";

export const RestDetailsPage: React.FC = () => {
  const [mount, setMount] = useState(true);

  const navigate = useNavigate();

  const handleToggle = () => {
    setMount((prev) => !prev);
  };

  return (
    <Container name="Details">
      <Stack direction="row" spacing={2}>
        <Box>
          <Button size="small" variant="contained" type="button" onClick={() => navigate(DASHBOARD_PAGE.path)}>
            Go Back
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
      {mount && <UserDetails />}
    </Container>
  );
};
