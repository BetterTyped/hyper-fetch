import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from "@mui/material";

import { Layout as DashboardLayout } from "layouts/dashboard/layout";
import { AccountProfile } from "layouts/dashboard/account/account-profile";
import { AccountProfileDetails } from "layouts/dashboard/account/account-profile-details";

export const AccountsPage = () => (
  <DashboardLayout>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <div>
            <Typography variant="h4">Account</Typography>
          </div>
          <div>
            <Grid container spacing={3}>
              <Grid xs={12} md={6} lg={4}>
                <AccountProfile />
              </Grid>
              <Grid xs={12} md={6} lg={8}>
                <AccountProfileDetails />
              </Grid>
            </Grid>
          </div>
        </Stack>
      </Container>
    </Box>
  </DashboardLayout>
);
