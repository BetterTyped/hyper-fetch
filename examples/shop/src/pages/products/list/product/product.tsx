import { useNavigate } from "react-router-dom";
import ClockIcon from "@heroicons/react/24/solid/ClockIcon";
import { Box, Card, CardContent, Chip, Divider, Stack, SvgIcon, Typography } from "@mui/material";

import { ProductType } from "api/firebase/products.api";
import { AddToCart } from "components/add-to-cart";
import { Price } from "components/price";
import styles from "./product.module.css";

export const Product = ({ product }: { product: ProductType }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Box
        display="flex"
        component="a"
        sx={{ "&:hover": { cursor: "pointer" } }}
        onClick={() => navigate(`/products/${product.__key}`)}
      >
        <Box
          component="img"
          src={product.image}
          sx={{
            width: 200,
            height: 200,
            objectFit: "contain",
          }}
        />
      </Box>
      <CardContent>
        <Typography
          gutterBottom
          component="a"
          variant="h5"
          sx={{ "&:hover": { cursor: "pointer", color: "text.secondary" } }}
          onClick={() => navigate(`/products/${product.__key}`)}
        >
          {product.name}
        </Typography>
        <Typography variant="body2" className={styles.description}>
          {product.description}
        </Typography>
        <Stack direction="row" spacing={1} mt={2}>
          {product.novelty && <Chip label="New!" color="primary" sx={{ fontWeight: 600 }} />}
          {!!product.discount && product.promotion && (
            <Chip label={`Discount -${product.discount}%`} variant="outlined" sx={{ fontWeight: 600 }} />
          )}
        </Stack>
      </CardContent>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Stack alignItems="flex-start" spacing={2} sx={{ p: 2 }}>
        <Price
          gutterBottom
          variant="h4"
          fontWeight="800"
          price={product.price}
          discount={product.discount}
          promotion={product.promotion}
        />
        <Stack alignItems="center" direction="row" spacing={1}>
          <SvgIcon color="action" fontSize="small">
            <ClockIcon />
          </SvgIcon>
          <Typography color="text.secondary" display="inline" variant="body2">
            {product.quantity ? "Delivery in 3 days" : "Out of stock"}
          </Typography>
        </Stack>
        <Stack alignItems="center" direction="row" spacing={1}>
          <AddToCart product={product} />
        </Stack>
      </Stack>
    </Card>
  );
};
