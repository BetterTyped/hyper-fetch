const { WebSocketServer } = require("ws");
const http = require("http");
const uuidv4 = require("uuid").v4;
const url = require("url");

const server = http.createServer();
const wsServer = new WebSocketServer({ server });

const port = 5050;
const connections = {};
const users = {};

const sendMessage = ({ connection, id, message, username, topic }) => {
  console.log(`${username} send message ${message} to ${topic}`);

  const response = {
    id,
    topic,
    data: { message, username, timestamp: new Date() },
  };

  connection.send(JSON.stringify(response));
};

const handleClose = (username, uuid, id) => {
  console.log(`${username} disconnected`);
  delete connections[uuid];
  delete users[uuid];
  broadcast();
  clearInterval(id);
};

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid];
    const message = JSON.stringify(users);
    connection.send(message);
  });
};

wsServer.on("connection", (connection, request) => {
  const { username } = url.parse(request.url, true).query;
  console.log(`${username} connected`);
  const uuid = uuidv4();
  connections[uuid] = connection;
  users[uuid] = {
    username,
    state: {},
  };
  connection.on("message", (data) => {
    console.log(`Received message from ${username}`);
    const value = JSON.parse(data.toString());

    // Acknowledge the message (https://hyperfetch.bettertyped.com/docs/documentation/sockets/emitter/#acknowledgements)
    sendMessage({
      connection,
      id: value.id,
      message: value.data.message,
      username,
      topic: "chat-message",
    });
  });

  // Send a message every 4 seconds to client
  const id = setInterval(() => {
    sendMessage({
      connection,
      id: "doesn't matter",
      message: "Hello world!",
      username: "Server User",
      topic: "messages",
    });
  }, 10000);

  connection.on("close", () => handleClose(username, uuid, id));
});

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});
