import { useMemo } from "react";
import { Button } from "@mui/material";

import { ProductType } from "api/firebase/products.api";
import { useCart } from "hooks/use-cart";

export const AddToCart = ({ product }: { product: ProductType }) => {
  const { items, addProduct } = useCart();

  const disabled = useMemo(() => {
    return items.find((item) => item.__key === product.__key)?.amount === product.quantity;
  }, [items, product.__key, product.quantity]);

  return (
    <Button
      variant="contained"
      size="large"
      sx={{ width: 250 }}
      disabled={!product.quantity || disabled}
      onClick={() => addProduct(product)}
    >
      Add to cart
    </Button>
  );
};
