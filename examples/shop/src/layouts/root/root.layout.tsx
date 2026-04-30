import { styled } from "@mui/material/styles";
import { TopNav } from "layouts/dashboard/top-nav";
import { Outlet } from "react-router-dom";

const LayoutRoot = styled("div")(() => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
}));

const LayoutContainer = styled("div")({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  width: "100%",
});

export const RootLayout = () => {
  return (
    <>
      <TopNav />
      <LayoutRoot>
        <LayoutContainer>
          <Outlet />
        </LayoutContainer>
      </LayoutRoot>
    </>
  );
};
