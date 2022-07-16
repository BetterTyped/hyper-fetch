/* eslint-disable no-console */
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useSubmit, useQueue } from "@better-typed/react-hyper-fetch";

import { patchUser, postUser, postFile } from "api";
import { Request } from "components/request";
import { Viewer } from "components/viewer";
import { RequestCard } from "components/request.card";

export const FormPage: React.FC = () => {
  // Post
  const result = useSubmit(postUser.setData({ email: "test", age: 12, name: "name" }));

  // Patch
  const resultPatch = useSubmit(patchUser.setData({ email: "test", age: 12, name: "name" }));

  // Queue
  const resultQueued = useSubmit(postFile.setData({ file: {} as unknown as File }));
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
      <Box sx={{ mb: 20 }}>
        <Typography>
          <b>Queued requests:</b> {requests.length}
        </Typography>
        {requests.map((request) => (
          <RequestCard key={request.requestId} request={request} />
        ))}
      </Box>
    </Viewer>
  );
};
