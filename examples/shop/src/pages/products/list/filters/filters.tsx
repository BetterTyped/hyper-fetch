import { Button, InputAdornment, OutlinedInput, Stack, Typography } from "@mui/material";

import { ButtonCheckbox } from "components";
import { useFilters } from "hooks/use-filters.hook";
import { useQuery } from "hooks/use-query.hook";
import styles from "./filters.module.css";

export const Filters = () => {
  const { queryString, query, setValue, getValue } = useFilters();
  const { setQueryParams } = useQuery();

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.block}>
          <Typography variant="h6" mt={1} mb={2}>
            Price
          </Typography>
          <Stack direction="row" alignItems="center" gap={2}>
            <OutlinedInput
              placeholder="From"
              value={getValue("from") as string}
              onChange={(e) => setValue("from")(e.target.value)}
              type="number"
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
            />
            -
            <OutlinedInput
              placeholder="To"
              value={getValue("to") as string}
              onChange={(e) => setValue("to")(e.target.value)}
              type="number"
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
            />
          </Stack>

          <Typography variant="h6" mt={3} mb={1}>
            Category
          </Typography>
          <ButtonCheckbox
            checked={!!getValue("new")}
            onClick={() => setValue("new")(!query.new ? true : "")}
            label="New"
          />

          <Button sx={{ mt: 3 }} variant="contained" onClick={() => setQueryParams({})} disabled={!queryString}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
