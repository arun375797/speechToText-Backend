// backend/server.js
import { createServer } from "http";
import app from "./src/app.js";   // <-- include /src and the .js extension

const PORT = process.env.PORT || 5000;
createServer(app).listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT} (${process.env.NODE_ENV})`);
});
