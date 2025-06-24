import { useFetch, useListener } from "@hyper-fetch/react";
import { Alert, Box, Container, Divider, Unstable_Grid2 as Grid, Skeleton, Stack, Typography } from "@mui/material";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useParams } from "react-router-dom";

import { client } from "api/clients";
import { getProduct, getProducts } from "api/firebase/products.api";
import { productListener } from "api/sockets/products.sockets";
import { AddToCart } from "components/add-to-cart";
import { Price } from "components/price";

export const ProductsDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { data, loading, error } = useFetch(getProduct.setParams({ productId: productId! }));

  const { onEvent } = useListener(productListener.setParams({ productId: productId! }), {});

  onEvent((event) => {
    // Update products list cache
    client.cache.update(getProducts, (oldData) => {
      return {
        ...oldData,
        data: oldData?.data?.map((product) => {
          if (product.__key === event.data?.__key) {
            return event.data;
          }
          return product;
        }),
      };
    });

    // Update single product cache
    client.cache.update(getProduct.setParams({ productId: productId! }), (oldData) => {
      return {
        ...oldData,
        data: event.data,
      };
    });
  });

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 5,
      }}
    >
      <Container maxWidth="lg">
        {!loading && error && <Alert severity="error">{JSON.stringify(error)}</Alert>}
        {data && (
          <Grid container spacing={10} mt={5} mx={0} maxWidth="100%">
            <Grid
              xs={12}
              md={6}
              lg={6}
              spacing={2}
              sx={{
                maxWidth: "50vw",
                borderRadius: 3,
                background:
                  "linear-gradient(121deg, rgba(230,230,230,0.6) 0%, rgba(230,230,240,1) 35%, rgba(249,249,249,0.7) 100%)",
              }}
            >
              <TransformWrapper>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Box
                    component="img"
                    src={data.image}
                    alt="test"
                    sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </TransformComponent>
              </TransformWrapper>
            </Grid>
            <Grid xs={12} md={6} lg={6} spacing={2}>
              <Typography variant="h3" gutterBottom>
                {data.name}
              </Typography>
              <Price variant="h6" price={data.price} discount={data.discount} promotion={data.promotion} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">{data.description}</Typography>
              <Stack alignItems="center" direction="row" spacing={1} mt={4}>
                <AddToCart product={data} />
              </Stack>
            </Grid>
          </Grid>
        )}
        {!data && loading && (
          <Grid container spacing={10} mt={5} maxWidth="100%">
            <Grid xs={12} md={6} lg={6} spacing={2}>
              <Skeleton
                sx={{
                  width: "100%",
                  height: 0,
                  transform: "none",
                  maxWidth: "50vw",
                  maxHeight: "400px",
                  paddingBottom: "100%",
                }}
              />
            </Grid>
            <Grid xs={12} md={6} lg={6} spacing={2}>
              <Skeleton height={40} sx={{ transform: "none", mb: 2 }} />
              <Skeleton height={200} sx={{ transform: "none", mb: 4 }} />
              <Skeleton height={60} width={250} sx={{ transform: "none", mb: 2 }} />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};
