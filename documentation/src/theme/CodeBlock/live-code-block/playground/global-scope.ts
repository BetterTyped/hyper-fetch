import React from "react";
import { createClient, Request } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { Highlight, themes } from "prism-react-renderer";
import { Terminal, AppWindowMac } from "lucide-react";

import { Loader } from "../components/loader";
import { NoContent } from "../components/no-content";
import { TinyLoader } from "../components/tiny-loader";

export const globalScope = {
  React,
  ...React,
  createClient,
  Request,
  useFetch,
  useSubmit,
  Highlight,
  Terminal,
  AppWindowMac,
  Loader,
  TinyLoader,
  NoContent,
  themes,
};
