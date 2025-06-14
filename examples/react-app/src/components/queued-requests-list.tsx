import React from "react";
import { Box, Typography } from "@mui/material";
import { QueueRequest } from "@hyper-fetch/react";
import { RequestInstance } from "@hyper-fetch/core";
import { RequestCard } from "./request.card";

interface QueuedRequestsListProps {
  requests: QueueRequest<RequestInstance>[];
}

export const QueuedRequestsList: React.FC<QueuedRequestsListProps> = ({ requests }) => {
  return (
    <Box sx={{ mb: 20 }}>
      <Typography>
        <b>Queued requests:</b> {requests.length}
      </Typography>
      {requests.map((request) => (
        <RequestCard key={request.requestId} request={request} />
      ))}
    </Box>
  );
};
