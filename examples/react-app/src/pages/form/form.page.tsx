/* eslint-disable no-console */
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useSubmit, useQueue } from "@hyper-fetch/react";

import { patchUser, postUser, postFile } from "../../api";
import { Request } from "../../components/request";
import { Viewer } from "../../components/viewer";
import { RequestCard } from "../../components/request.card";
import { QueuedRequestsList } from "../../components/queued-requests-list";

export const FormPage: React.FC = () => {
  // Post
  const result = useSubmit(postUser.setPayload({ email: "test", age: 12, name: "name" }));

  // Patch
  const resultPatch = useSubmit(
    patchUser
      .setParams({ userId: Math.round(Math.random() * 10000) })
      .setPayload({ email: "test", age: 12, name: "name" }),
  );

  // Queue
  const resultQueued = useSubmit(postFile.setPayload({ file: {} as unknown as File }));
  const { stopped, requests, stop, start } = useQueue(postFile);

  return (
    <Viewer name="Form">
      <Request name="Post" result={result as any}>
        <Button type="button" variant="contained" onClick={() => result.submit()}>
          Submit
        </Button>
      </Request>
      <Request name="Patch" result={resultPatch as any}>
        <Button type="button" variant="contained" onClick={() => resultPatch.submit()}>
          Submit
        </Button>
      </Request>
      <Request name="Queue" result={resultQueued as any}>
        <Button type="button" variant="contained" onClick={() => resultQueued.submit()} sx={{ mr: 2 }}>
          Add to Queue
        </Button>
        {!stopped && (
          <Button type="button" variant="contained" color="error" onClick={() => stop()}>
            Stop queue
          </Button>
        )}
        {stopped && (
          <Button type="button" variant="contained" color="success" onClick={() => start()}>
            Start queue
          </Button>
        )}
      </Request>
      <QueuedRequestsList requests={requests} />
    </Viewer>
  );
};
