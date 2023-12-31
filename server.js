import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import {
  getDocument,
  updateDocument,
} from "./controller/document-controller.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//database config
await connectDB();
//configure env
dotenv.config();

const app = express();


const server = http.createServer(app);
//const io = new Server(server);

app.use(express.static(path.join(__dirname, "./client/build")));

//rest api
app.use("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

const PORT = process.env.PORT || 8080;

const io = new Server(PORT, {
  cors: {
    origin: server,
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await getDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await updateDocument(documentId, data);
    });
  });
});

io.listen(server);

// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

