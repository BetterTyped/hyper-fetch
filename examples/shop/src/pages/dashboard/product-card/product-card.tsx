import { useState } from "react";
import { useSubmit } from "@hyper-fetch/react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import { ProductType, getProduct } from "api/firebase/products.api";
import { Price } from "components/price";
import styles from "./product-card.module.css";

export const ProductCard = ({ product }: { product: ProductType }) => {
  const [preloaded, setPreloaded] = useState(false);
  const { submit, submitting, onSubmitSuccess } = useSubmit(getProduct.setParams({ productId: product.__key }));

  onSubmitSuccess(() => {
    setPreloaded(true);
  });

  const preloadProduct = () => {
    if (!submitting && !preloaded) {
      submit();
    }
  };

  return (
    <Link to={`/products/${product.__key}`} className={styles.link} onMouseEnter={preloadProduct}>
      <Box
        className={styles.wrapper}
        position="relative"
        sx={{
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Box
          component="img"
          src={product.image}
          position="absolute"
          sx={{ inset: "0", width: "100%", height: "100%", objectFit: "contain", p: 2 }}
        />
      </Box>
      <Typography variant="subtitle1" gutterBottom color="text.primary">
        {product.name}
      </Typography>
      <Price
        variant="h6"
        color="primary"
        price={product.price}
        discount={product.discount}
        promotion={product.promotion}
      />
    </Link>
  );
};
