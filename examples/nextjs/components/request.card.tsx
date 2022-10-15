import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { QueueRequest } from "@hyper-fetch/react";
import { CommandInstance } from "@hyper-fetch/core";

type Props = {
  request: QueueRequest<CommandInstance>;
};

export function RequestCard({ request }: Props) {
  return (
    <Card
      sx={{
        minWidth: 275,
        mt: 2,
        padding: 0,
        background: "#eaeaea",
        boxShadow:
          "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        <Typography sx={{ fontSize: 11 }} color="text.secondary" gutterBottom>
          Ongoing Request
        </Typography>
        <Typography sx={{ fontSize: 15 }} variant="h5">
          Request ID: <b>{request.requestId}</b>
        </Typography>
        <Typography sx={{ fontSize: 13 }} color="text.secondary">
          Added at: <b>{new Date(request.timestamp).toLocaleTimeString()}</b>
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant="contained"
          color={request.stopped ? "success" : "error"}
          onClick={request.stopped ? request.startRequest : request.stopRequest}
        >
          {request.stopped ? "Start Request" : "Stop Request"}
        </Button>
      </CardActions>
    </Card>
  );
}
