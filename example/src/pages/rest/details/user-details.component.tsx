import React, { useState } from "react";
import Countdown from "react-countdown";
import { useFetch, DateInterval } from "@better-typed/react-fetch";

import { getUser } from "../server/user.api";

const refreshTime = DateInterval.second * 10;

export const UserDetails: React.FC = () => {
  const [fetched, setFetched] = useState(false);

  const { data, loading, error, refresh, timestamp } = useFetch(
    getUser.onRequestStart(() => {
      setFetched(true);
    }),
    {
      cacheTime: refreshTime,
      refresh: true,
      refreshTime,
    },
  );

  return (
    <div>
      <button onClick={() => refresh()}>Refresh</button>
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
