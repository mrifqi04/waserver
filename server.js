const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const qrcodeTerminal = require("qrcode-terminal");
const qrcode = require("qrcode");
const socketIO = require("socket.io");
const http = require("http");

// initial instance
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const client = new Client({
  restartOnAuthFail: true,
  authStrategy: new LocalAuth(),
});

// initialize whatsapp and the example event
client.on("message", (msg) => {
  if (msg.body == "beb" || msg.body == "Beb") {
    msg.reply("Iya sayang ku cintaku manisku geliues ku my honey body sweety, kenapa?");
  }
});

// socket connection
var today = new Date();
var now = today.toLocaleString();
io.on("connection", (socket) => {
  socket.emit("message", `${now} Connected`);
  console.log("connected");

  getBarcode(socket);

  client.on("ready", () => {
    socket.emit("message", `${now} WhatsApp is ready!`);
    socket.emit("isConnected", true);

    console.log("WhatsApp is ready!");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", `${now} Auth failure, restarting...`);
  });

  client.on("disconnected", function () {
    socket.emit("message", `${now} Disconnected`);
    socket.emit("isConnected", false);
    console.log("Disconnected");

    client.destroy();

    getBarcode(socket);
  });
});

function getBarcode(socket) {
  client.initialize();
  socket.emit("isConnected", false);

  client.on("qr", (qr) => {
    qrcodeTerminal.generate(qr, { small: true });

    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", `${now} QR Code received`);
    });
  });
}

// index routing and middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

// send message routing
app.post("/send", (req, res) => {
  const { phone, message } = req.body;
  client
    .sendMessage(phone, message)
    .then((response) => {
      res.status(200).json({
        error: false,
        data: {
          message: "Pesan terkirim",
          meta: response,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        error: true,
        data: {
          message: "Error send message",
          meta: error,
        },
      });
    });
});

server.listen(PORT, () => {
  console.log("App listen on port ", PORT);
});
