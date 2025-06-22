import React, { useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import OutsideClickHandler from "react-outside-click-handler";
import { Box, InputAdornment, OutlinedInput, SvgIcon } from "@mui/material";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { $limit, $orderBy, $where } from "@hyper-fetch/firebase";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "react-router-dom";

import { ProductType, getProduct, getProductsSearch } from "api/firebase/products.api";
import styles from "./search-widget.module.css";

const ListElement = ({ setClose, product }: { setClose: VoidFunction; product: ProductType }) => {
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
    <div className={styles.linkWrapper}>
      <Link
        to={`/products/${product.__key}`}
        className={styles.link}
        onMouseEnter={preloadProduct}
        onClick={() => setClose()}
      >
        <Box component="img" src={product.image} className={styles.logo} />
        <div className={styles.name}>{product.name}</div>
      </Link>
    </div>
  );
};

export const SearchWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading } = useFetch(
    getProductsSearch.setQueryParams({
      constraints: [$orderBy("name"), $where("name", ">=", search), $where("name", "<=", `${search}\uf8ff`), $limit(4)],
    }),
    {
      bounce: true,
      bounceTime: 400,
    },
  );

  const onClose = () => {
    setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <OutsideClickHandler onOutsideClick={onClose}>
        <OutlinedInput
          defaultValue=""
          fullWidth
          placeholder="Search for product"
          onFocus={() => setOpen(true)}
          onChange={(event) => setSearch(event.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SvgIcon color="action" fontSize="small">
                <MagnifyingGlassIcon />
              </SvgIcon>
            </InputAdornment>
          }
          sx={{ width: "350px", maxWidth: "100%", mr: 4 }}
        />
        {open && (
          <div className={styles.menu}>
            {!data && loading && (
              <Box px={2} py={3}>
                <CircularProgress size={20} />
              </Box>
            )}
            {!data && !loading && (
              <Box px={2} py={3}>
                No content
              </Box>
            )}
            {data && (
              <div>
                <h3 className={styles.results}>Results: {loading && <CircularProgress size={15} sx={{ ml: 1 }} />}</h3>
                {data?.length && (
                  <div className={styles.group}>
                    {data.map((product) => (
                      <ListElement key={product.__key} setClose={() => setOpen(false)} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </OutsideClickHandler>
    </div>
  );
};
