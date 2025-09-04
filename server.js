// server.js
import { createServer } from "http";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT} (${process.env.NODE_ENV})`);
});
