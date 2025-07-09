import React from "react";
import { createClient, Request } from "@hyper-fetch/core";
import { useFetch, useSubmit, useQueue, useCache } from "@hyper-fetch/react";
import { Highlight, themes } from "prism-react-renderer";
import { Terminal, AppWindowMac } from "lucide-react";

import { Loader } from "../components/loader";
import { NoContent } from "../components/no-content";
import { TinyLoader } from "../components/tiny-loader";
import { Alert, AlertTitle, AlertDescription } from "../components/alert";
import { CircularProgress } from "../components/circular-progress";
import { Chip } from "../components/chip";
import { Button } from "../components/button";
import { TextField } from "../components/text-field";
import { RequestsLifecycle } from "../components/client-requests/components/request-lifecycle";
import { Table } from "../components/table";
import { Separator } from "../components/separator";

export const globalScope = {
  React,
  ...React,
  createClient,
  Request,
  useFetch,
  useSubmit,
  useQueue,
  useCache,
  Highlight,
  Terminal,
  AppWindowMac,
  Loader,
  TinyLoader,
  NoContent,
  themes,
  Alert,
  AlertTitle,
  AlertDescription,
  CircularProgress,
  Chip,
  Button,
  Table,
  Separator,
  TextField,
  RequestsLifecycle,
};
