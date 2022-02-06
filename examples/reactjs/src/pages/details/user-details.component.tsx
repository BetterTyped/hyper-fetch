import React, { useState } from "react";
import Countdown from "react-countdown";
import { DateInterval } from "@better-typed/hyper-fetch";
import { useFetch } from "@better-typed/react-hyper-fetch";

import { getUser } from "../server/user.api";

const refreshTime = DateInterval.second * 10;
const initialDate = +new Date();

export const UserDetails: React.FC = () => {
  const [dep, setDep] = useState(initialDate);
  const [fetched, setFetched] = useState(false);

  const { data, loading, error, refresh, timestamp, onRequestStart } = useFetch(getUser.setQueryParams({ date: dep }), {
    dependencies: [dep],
    refresh: true,
    refreshTime,
    revalidateOnMount: false,
  });

  onRequestStart(() => {
    setFetched(true);
  });

  return (
    <div>
      <button type="button" onClick={() => setDep(+new Date())}>
        Change dependency
      </button>
      <button type="button" onClick={() => refresh()}>
        Refresh
      </button>
      <h3>User Request Details:</h3>
      <div>
        <b>fetched:</b> {String(fetched)}
      </div>
      <div>
        <b>loading:</b> {String(loading)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(error)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(data)}
      </div>
      <div>
        <b>timestamp:</b> {timestamp?.toDateString()} {timestamp?.toLocaleTimeString()}
      </div>
      <div>
        <b>refresh in:</b>{" "}
        <Countdown
          date={timestamp ? +timestamp + refreshTime : Date.now() + refreshTime}
          key={String(timestamp?.getTime())}
        />
      </div>
    </div>
  );
};
