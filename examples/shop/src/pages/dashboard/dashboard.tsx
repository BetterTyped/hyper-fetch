import { useFetch } from "@hyper-fetch/react";
import { $limit } from "@hyper-fetch/firebase";
import { Box, Button, Container, Typography, Unstable_Grid2 as Grid, Skeleton, Alert } from "@mui/material";
import { Link } from "react-router-dom";

import { ProductCard } from "./product-card/product-card";
import { getProducts } from "api/firebase/products.api";

export const DashboardPage = () => {
  const { data, error, loading } = useFetch(getProducts.setQueryParams({ constraints: [$limit(12)] }), {
    initialResponse: { data: [] },
  });

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        <Box
          height={420}
          sx={{
            borderRadius: 3,
            background:
              "linear-gradient(121deg, rgba(230,180,220,0.3) 0%, rgba(230,230,240,1) 35%, rgba(249,209,249,0.4) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: 3,
            px: 12,
            position: "relative",
          }}
        >
          <Typography variant="body1">Beats Solo</Typography>
          <Typography variant="h1">Wireless</Typography>
          <Typography
            variant="h1"
            color="primary.main"
            fontSize={100}
            letterSpacing={3}
            textTransform="uppercase"
            fontWeight="900"
          >
            Headphones
          </Typography>
          <Box mt={4}>
            <Link to="/products">
              <Button color="primary" variant="contained">
                See more headphones
              </Button>
            </Link>
          </Box>
          <Box
            component="img"
            src="https://cdn.sanity.io/images/kyml1h03/production/a205aaa5ac2c75342801e683c3b78ea2fff8913b-600x600.webp"
            sx={{
              position: "absolute",
              right: "140px",
              width: 440,
              zIndex: 1,
              mt: -6,
            }}
          />
        </Box>
        <Typography variant="h2" mt={8} align="center">
          Best Seller Products
        </Typography>
        <Typography variant="body1" mt={1} mb={5} align="center">
          With many variants and colors
        </Typography>
        <Grid container spacing={10}>
          {!loading && error && <Alert severity="error">{JSON.stringify(error)}</Alert>}
          {loading &&
            !data?.length &&
            Array.from({ length: 12 }, (_, element) => (
              <Grid xs={12} md={4} lg={3} key={element}>
                <Box
                  position="relative"
                  sx={{
                    width: "100%",
                    paddingBottom: "75%",
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Box position="absolute" sx={{ inset: "0", width: "100%", height: "100%", objectFit: "contain" }}>
                    <Skeleton sx={{ height: "100%", transform: "none" }} />
                  </Box>
                </Box>
                <Skeleton height={30} />
                <Skeleton height={40} />
              </Grid>
            ))}
          {data?.map((product) => (
            <Grid xs={12} md={4} lg={3} key={product.__key}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
