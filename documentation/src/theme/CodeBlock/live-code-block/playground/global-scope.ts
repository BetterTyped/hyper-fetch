import React from "react";
import { createClient } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { Highlight, themes } from "prism-react-renderer";
import { Terminal } from "lucide-react";

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
  Terminal,
  Loader,
  TinyLoader,
  NoContent,
  themes,
};
