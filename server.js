import { createServer } from "http";
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
