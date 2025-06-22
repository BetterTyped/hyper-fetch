import { useFetch } from "@hyper-fetch/react";
import { $orderBy, $where, FirestorePermittedMethods } from "@hyper-fetch/firebase";
import { Box, Container, Stack, Typography, Breadcrumbs, Alert, Skeleton } from "@mui/material";

import { getProducts } from "api/firebase/products.api";
import { Product } from "./product/product";
import { Filters } from "./filters/filters";
import { useQuery } from "hooks/use-query.hook";
import { Sorting } from "./sorting/sorting";

export const ProductsPage = () => {
  const { query } = useQuery();

  const getConstraints = () => {
    const constraints: FirestorePermittedMethods[] = [];

    if (query.from) {
      constraints.push($where("price", ">=", Number(query.from)));
    }
    if (query.to) {
      constraints.push($where("price", "<=", Number(query.to)));
    }
    if (query.new) {
      constraints.push($where("novelty", "==", true));
    }
    if (query.sort) {
      constraints.push($orderBy(query.sort as string));
    }

    return constraints;
  };

  const { data, error, loading } = useFetch(
    getProducts.setQueryParams({
      constraints: getConstraints(),
    }),
    {
      initialResponse: { data: [] },
      dependencies: [JSON.stringify(query)],
    },
  );

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 5,
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" spacing={4}>
          <Stack spacing={1} mb={3}>
            <Typography variant="h5">Products ({data?.length} Results)</Typography>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography>Reins</Typography>
                <Typography color="text.primary">Products</Typography>
              </Breadcrumbs>
            </Stack>
          </Stack>
          <Box>
            <Sorting />
          </Box>
        </Stack>
        <Stack spacing={3} direction="row">
          <Filters />
          <Stack spacing={3} maxWidth="100%" width="100%">
            {!loading && error && <Alert severity="error">{JSON.stringify(error)}</Alert>}
            <Stack spacing={4}>
              {loading &&
                !data?.length &&
                Array.from({ length: 12 }, (_, element) => (
                  <Box maxWidth="100%" key={element}>
                    <Skeleton key={element} height={206} width="100%" sx={{ borderRadius: 3, transform: "none" }} />
                  </Box>
                ))}
              {data?.map((product) => {
                return <Product product={product} key={product.__key} />;
              })}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
