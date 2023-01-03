import React from "react";
import { Redirect } from "@docusaurus/router";

export default function NotFoundWrapper(props) {
  return <Redirect to="/" />;
}
