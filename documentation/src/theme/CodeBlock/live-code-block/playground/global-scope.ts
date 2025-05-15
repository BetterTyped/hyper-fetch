import React from "react";
import { createClient } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { Highlight, themes } from "prism-react-renderer";

import { Loader } from "../components/loader";
import { NoContent } from "../components/no-content";
import { TinyLoader } from "../components/tiny-loader";

export const globalScope = {
  React,
  ...React,
  createClient,
  useFetch,
  useSubmit,
  Highlight,
  Loader,
  TinyLoader,
  NoContent,
  themes,
};
