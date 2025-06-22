import { useState } from "react";
import CartIcon from "@heroicons/react/24/solid/ShoppingCartIcon";
import { Avatar, Badge, Box, Container, Drawer, IconButton, Stack, SvgIcon, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";

import { usePopover } from "hooks/use-popover";
import { ProductCartItem, useCart } from "hooks/use-cart";
import { AccountPopover } from "./account-popover";
import { Logo } from "components/logo";
import { Cart } from "./cart/cart";
import { SearchWidget } from "./search/search-widget";
import { routes } from "config/router";

const TOP_NAV_HEIGHT = 64;

const useToggle = (initialValue: boolean = false) => {
  const [toggle, setToggle] = useState(initialValue);
  return [toggle, () => setToggle((prev) => !prev)] as const;
};

export const TopNav = () => {
  const accountPopover = usePopover();
  const location = useLocation();
  const { items } = useCart();
  const [toggle, onToggle] = useToggle();

  const total = items.reduce((acc: number, item: ProductCartItem) => acc + item.amount, 0);

  return (
    <>
      <Box
        component="header"
        sx={{
          backdropFilter: "blur(6px)",
          backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            spacing={3}
            sx={{
              minHeight: TOP_NAV_HEIGHT,
            }}
          >
            <Stack alignItems="center" direction="row" spacing={6}>
              <Link to="/">
                <Logo light={false} />
              </Link>
              <Box
                component="nav"
                sx={{
                  flexGrow: 1,
                  px: 2,
                  py: 3,
                  pt: "20px",
                }}
              >
                <Stack
                  component="ul"
                  spacing={0.5}
                  direction="row"
                  gap={3}
                  sx={{
                    listStyle: "none",
                    p: 0,
                    m: 0,
                  }}
                >
                  {Object.values(routes)
                    .filter((route) => route.breadcrumb)
                    .map((item) => {
                      const active = item.path ? location.pathname === item.path : false;

                      return (
                        <Box
                          key={item.path}
                          component={Link}
                          sx={{
                            textDecoration: "none",
                            fontWeight: "600",
                            color: active ? "primary.main" : "text.primary",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                          to={item.path}
                        >
                          {item.name}
                        </Box>
                      );
                    })}
                </Stack>
              </Box>
            </Stack>
            <Stack alignItems="center" direction="row" spacing={2}>
              <SearchWidget />
              <Tooltip title="Cart">
                <IconButton onClick={() => onToggle()}>
                  <Badge
                    badgeContent={total}
                    color="error"
                    sx={{ "& .MuiBadge-badge": { top: "-3px", right: "-3px" } }}
                  >
                    <SvgIcon fontSize="small">
                      <CartIcon />
                    </SvgIcon>
                  </Badge>
                </IconButton>
              </Tooltip>
              <Avatar
                onClick={accountPopover.handleOpen}
                ref={accountPopover.anchorRef}
                sx={{
                  cursor: "pointer",
                  height: 40,
                  width: 40,
                }}
                src="/assets/avatars/avatar-anika-visser.png"
              />
            </Stack>
          </Stack>
        </Container>
      </Box>
      <AccountPopover
        anchorEl={accountPopover.anchorRef.current}
        open={accountPopover.open}
        onClose={accountPopover.handleClose}
      />
      <Drawer anchor="right" open={toggle} onClose={onToggle}>
        <Cart />
      </Drawer>
    </>
  );
};
