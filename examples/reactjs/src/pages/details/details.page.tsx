import React, { useState } from "react";
import { DateInterval } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";

import { getUser } from "api";

const refreshTime = DateInterval.second * 10;
const initialDate = +new Date();

export const DetailsPage: React.FC = () => {
  const [dep, setDep] = useState(initialDate);

  const result = useFetch(getUser, {
    // dependencies: [dep],
    // refresh: true,
    refreshTime,
  });

  console.log({ data: result.data, loading: result.loading });

  if (result.loading) {
    console.log("Loading new data");
    return "Loading";
  }

  if (result.error) {
    console.log("An error was found");
    return "Error";
  }

  if (!result.data) {
    console.log("No data found with the request!");
    return "No data found";
  }

  return JSON.stringify(result.data, null, 2);
};
