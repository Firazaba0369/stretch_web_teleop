const io = require("socket.io-client");

const socket = io("http://localhost:3000", { transports: ["websocket"] });

socket.on("connect", () => {
  console.log("mock robot connected:", socket.id);
  socket.emit("join_as_robot", (resp) => console.log("join_as_robot resp:", resp));
});

socket.on("signalling", (msg) => {
  console.log("robot got signalling:", msg);

  // If operator sends an offer, you can at least reply with *something*.
  // (May still need real SDP later depending on frontend.)
  if (msg?.type === "offer") {
    socket.emit("signalling", { type: "answer", sdp: "MOCK_SDP_ANSWER" });
  }
});