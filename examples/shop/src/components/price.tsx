/* eslint-disable react/require-default-props */
import { Box, Typography, TypographyProps } from "@mui/material";

export const Price = ({
  price,
  promotion = false,
  discount = 0,
  ...rest
}: { promotion?: boolean; discount?: number; price: number } & TypographyProps) => {
  const currPrice = price.toFixed(2);
  const beforePrice = (price + (price * discount) / 100).toFixed(2);

  return (
    <Box display="flex" alignItems="baseline">
      <Typography variant="subtitle1" {...rest}>
        ${currPrice}
      </Typography>
      {!!discount && !!promotion && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ textDecoration: "line-through", ml: 1 }}>
          ${beforePrice}
        </Typography>
      )}
    </Box>
  );
};
