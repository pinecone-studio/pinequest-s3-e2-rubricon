const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  const emitSignaling = ({ roomId, to, event, payload }) => {
    if (to) {
      io.to(to).emit(event, payload);
      return;
    }
    socket.to(roomId).emit(event, payload);
  };

  socket.on("join-room", ({ roomId, role }) => {
    socket.join(roomId);
    const joinedRooms = socket.data.joinedRooms ?? new Set();
    joinedRooms.add(roomId);
    socket.data.joinedRooms = joinedRooms;
    socket.data.role = role;

    console.log(`${role} joined ${roomId}`);

    socket.to(roomId).emit("peer-joined", {
      socketId: socket.id,
      role,
      roomId,
    });
  });

  socket.on("request-offer", ({ roomId, to }) => {
    emitSignaling({
      roomId,
      to,
      event: "request-offer",
      payload: {
        from: socket.id,
        roomId,
      },
    });
  });

  socket.on("offer", ({ roomId, sdp, to }) => {
    emitSignaling({
      roomId,
      to,
      event: "offer",
      payload: {
        sdp,
        from: socket.id,
        roomId,
      },
    });
  });

  socket.on("answer", ({ roomId, sdp, to }) => {
    emitSignaling({
      roomId,
      to,
      event: "answer",
      payload: {
        sdp,
        from: socket.id,
        roomId,
      },
    });
  });

  socket.on("ice-candidate", ({ roomId, candidate, to }) => {
    emitSignaling({
      roomId,
      to,
      event: "ice-candidate",
      payload: {
        candidate,
        from: socket.id,
        roomId,
      },
    });
  });

  socket.on("disconnect", () => {
    const joinedRooms = socket.data.joinedRooms;
    if (joinedRooms && joinedRooms.size > 0) {
      for (const roomId of joinedRooms) {
        socket.to(roomId).emit("peer-left", {
          socketId: socket.id,
          role: socket.data.role,
          roomId,
        });
      }
    } else if (socket.data.roomId) {
      const roomId = socket.data.roomId;
      socket.to(roomId).emit("peer-left", {
        socketId: socket.id,
        role: socket.data.role,
        roomId,
      });
    }
    console.log("disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Signaling server running on http://localhost:4000");
});
