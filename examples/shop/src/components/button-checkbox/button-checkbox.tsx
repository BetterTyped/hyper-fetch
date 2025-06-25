/* eslint-disable react/require-default-props */
import React from "react";
import { Box, Checkbox, Stack } from "@mui/material";

type ButtonCheckboxProps = {
  checked: boolean;
  onClick: () => void;
  label?: string;
};

export const ButtonCheckbox: React.FC<ButtonCheckboxProps> = ({ checked, onClick, label = "" }) => {
  return (
    <Stack direction="row" alignItems="center" key={String(checked)} sx={{ mb: "-10px" }}>
      <Checkbox onClick={onClick} name={label} value={checked} checked={checked} />
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          background: "transparent",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          color: "text.secondary",
          cursor: "pointer",
          "&:hover": {
            opacity: 0.7,
          },
        }}
      >
        {label}
      </Box>
    </Stack>
  );
};
