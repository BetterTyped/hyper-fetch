import React, { useEffect, useState } from "react";
import { DateInterval } from "@better-typed/react-fetch";

import { GetUsersComponent } from "components/get-users-component";

export const App: React.FC = () => {
  const [unmounted, setUnmounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setUnmounted(true);
    }, DateInterval.second * 10);
  }, []);

  return (
    <div>
      React Fetch test
      <GetUsersComponent />
      <GetUsersComponent />
      {unmounted && <GetUsersComponent />}
      {unmounted && <GetUsersComponent />}
      {unmounted && <GetUsersComponent />}
      {!unmounted && <GetUsersComponent />}
    </div>
  );
};
