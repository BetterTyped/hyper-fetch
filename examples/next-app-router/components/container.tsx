"use client";

import Box from "@mui/material/Box";
import ContainerComponent from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import React from "react";

type ContainerProps = {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  name?: string;
};

export const Container: React.FC<ContainerProps> = ({ children, name }) => {
  return (
    <Box sx={{ width: "100%", padding: "20px 0" }}>
      <ContainerComponent>
        <Typography variant="h3" sx={{ fontWeight: "800" }}>
          {name}
        </Typography>
        <Box sx={{ marginTop: "20px" }}>{children}</Box>
      </ContainerComponent>
    </Box>
  );
};
