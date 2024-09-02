/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from "react";
import { useEmitter, useListener } from "@hyper-fetch/react";
import { Typography, Box, TextField, Stack, Button, Card, CardContent, CardHeader, Avatar } from "@mui/material";
import { ExtractListenerResponseType } from "@hyper-fetch/sockets";
import { blue, red } from "@mui/material/colors";

import { Viewer } from "../../components/viewer";
import { getMessage, sendMessage } from "../../api/websockets/websockets";
import { socket } from "../../api";

export const WebsocketsPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ExtractListenerResponseType<typeof getMessage>[]>([]);
  const { onEvent } = useListener(getMessage, {});
  const { emit } = useEmitter(sendMessage, {});

  onEvent((event) => {
    console.log("I RECEIVED A MESSAGE", event);
    setMessages((prev) => [...prev, event.data]);
  });

  const handleSend = async () => {
    if (!message) return;

    setMessage("");
    emit({
      data: {
        message,
        username: "Client User",
        timestamp: new Date().toLocaleTimeString(),
      },
    });
  };

  useEffect(() => {
    socket.setQuery({
      username: "Client User",
    });
    socket.connect();
  }, []);

  return (
    <Viewer name="Websockets">
      <Box>
        <Typography variant="h6" gutterBottom>
          Websockets
        </Typography>
        <Typography variant="body1" gutterBottom color="GrayText" mb={3}>
          Websockets are not supported in the browser. You can try to run the server example to see how it works.
        </Typography>
      </Box>
      <Box sx={{ background: "rgba(0,0,0,0.05)", p: 3, pb: 5, borderRadius: "10px" }}>
        <Typography variant="h5" mb={2}>
          Send websocket event:
        </Typography>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              size="small"
              placeholder="Write some message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button type="submit" variant="contained" size="small">
              Send
            </Button>
          </Stack>
        </form>

        <Typography variant="h5" mt={4} mb={2}>
          Your messages:
        </Typography>
        {messages.map(({ message: msg, username, timestamp }, index) => (
          <Card key={index} sx={{ p: 2, mt: 1 }}>
            <CardHeader
              sx={{
                p: 0,
              }}
              avatar={
                <Avatar sx={{ bgcolor: username.includes("Server") ? red[500] : blue[500] }} aria-label="recipe">
                  {username.includes("Server") ? "S" : "C"}
                </Avatar>
              }
              title={username}
              subheader={timestamp}
            />
            <CardContent sx={{ padding: "10px 0 0 0!important" }}>
              <Typography variant="body1">{msg}</Typography>
            </CardContent>
          </Card>
        ))}
        {!messages.length && (
          <Typography variant="body2" color="GrayText">
            No messages yet
          </Typography>
        )}
      </Box>
    </Viewer>
  );
};
