import { useCache } from "@hyper-fetch/react";
import { Box, Button, Divider, Typography, SvgIcon, Stack } from "@mui/material";
import { useDidUpdate } from "@better-hooks/lifecycle";
import ShoppingIcon from "@heroicons/react/24/solid/ShoppingBagIcon";
import CreditCard from "@heroicons/react/24/solid/CreditCardIcon";

import { getProducts } from "api/firebase/products.api";
import { ProductCartItem, useCart } from "hooks/use-cart";
import { Price } from "components/price";
import { useCheckout } from "hooks/use-checkout";

export const Cart = () => {
  const { items, setState } = useCart();

  const { data: cacheProducts } = useCache(getProducts);
  const { setCheckout } = useCheckout();

  useDidUpdate(() => {
    setState((draft) => {
      draft.items = draft.items
        .map((product) => {
          const matched = cacheProducts?.find((item) => item.__key === product.__key);
          if (matched) {
            return {
              ...product,
              name: matched.name,
              quantity: matched.quantity,
              price: matched.price,
              amount: matched.quantity < product.amount ? matched.quantity : product.amount,
            };
          }
          return product;
        })
        .filter((product) => product.amount > 0);
    });
  }, [cacheProducts]);

  const onRemove = (product: ProductCartItem) => {
    setState((draft) => {
      draft.items.some((item, index) => {
        if (item.__key === product.__key) {
          draft.items.splice(index, 1);
          return true;
        }
        return false;
      });
    });
  };

  const onAdd = (product: ProductCartItem) => {
    setState((draft) => {
      draft.items.some((item, index) => {
        if (item.__key === product.__key && item.amount < product.quantity) {
          draft.items[index].amount += 1;
          return true;
        }
        return false;
      });
    });
  };

  const onSubtract = (product: ProductCartItem) => {
    setState((draft) => {
      draft.items.some((item, index) => {
        if (item.__key === product.__key) {
          if (draft.items[index].amount === 1) {
            onRemove(product);
          } else {
            draft.items[index].amount -= 1;
          }
          return true;
        }
        return false;
      });
    });
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + Number(item.price) * Number(item.amount), 0);
  };

  const onCheckout = () => {
    setCheckout(true);
    setState({ items: [] });
  };

  const total = items.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Box width={600} py={5}>
      <Box px={4} display="flex" alignItems="center" gap={2} mb={5}>
        <SvgIcon
          fontSize="large"
          color="primary"
          sx={{ background: "#eeeeee", p: 1, width: 50, height: 50, borderRadius: 100 }}
        >
          <ShoppingIcon />
        </SvgIcon>
        <Typography variant="h4">Your Cart</Typography>
        <Typography variant="subtitle1" mt="10px">
          ({total} items)
        </Typography>
      </Box>
      <Divider />
      <Box px={4}>
        {items.length === 0 ? (
          <Box my={4}>
            <Typography variant="h6" color="text.secondary" mb={1}>
              Empty
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              No items in cart.
            </Typography>
          </Box>
        ) : null}
        {items.map((item, index) => (
          <Box key={item.__key}>
            {!!index && <Divider />}
            <Box display="flex" my={2} gap={3}>
              <Box
                width={80}
                height="auto"
                sx={{ objectFit: "contain" }}
                component="img"
                src={item.image}
                alt={item.name}
              />
              <Box flex="1 1 auto" display="flex" flexDirection="column" justifyContent="center">
                <Typography variant="h5" display="flex" justifyContent="space-between" mb={1}>
                  {item.name}
                </Typography>
                <Price
                  variant="h6"
                  color="primary"
                  price={item.price}
                  discount={item.discount}
                  promotion={item.promotion}
                />
              </Box>
              <Stack justifyContent="center">
                <Box display="grid" gridTemplateColumns="35px 40px 35px" alignItems="center" mb={1}>
                  <Button
                    size="small"
                    disableElevation
                    variant="outlined"
                    color="primary"
                    onClick={() => onSubtract(item)}
                    disabled={item.amount === 1}
                    sx={{ fontSize: 16, px: 1, minWidth: 0, borderWidth: "2px!important", height: "35px", pb: "10px" }}
                  >
                    -
                  </Button>
                  <Typography variant="h5" sx={{ width: "100%", textAlign: "center" }}>
                    {item.amount}
                  </Typography>
                  <Button
                    size="small"
                    disableElevation
                    variant="outlined"
                    color="primary"
                    onClick={() => onAdd(item)}
                    disabled={item.amount === item.quantity}
                    sx={{ fontSize: 16, p: 1, minWidth: 0, borderWidth: "2px!important", height: "35px", pb: "12px" }}
                  >
                    +
                  </Button>
                </Box>
                <Button onClick={() => onRemove(item)} color="error" size="small">
                  Remove
                </Button>
              </Stack>
            </Box>
          </Box>
        ))}
      </Box>
      <Divider />
      <Stack direction="row" px={4} gap={4} mt={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Subtotal:{" "}
          </Typography>
          <Price variant="h4" price={calculateTotal()} mb={1} />
        </Box>
        <Button
          size="large"
          sx={{ fontSize: 20 }}
          variant="contained"
          color="primary"
          fullWidth
          disabled={!items.length}
          onClick={onCheckout}
        >
          Checkout
          <SvgIcon fontSize="large" sx={{ ml: 2 }}>
            <CreditCard />
          </SvgIcon>
        </Button>
      </Stack>
    </Box>
  );
};
