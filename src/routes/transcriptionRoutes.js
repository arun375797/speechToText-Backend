import { Router } from "express";
import authRequired from "../middlewares/authRequired.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  createTranscription,
  myTranscriptions,
  listHistory,
  saveHistory,
  deleteHistory,
} from "../controllers/transcriptionController.js";

export default function transcriptionRoutes(upload) {
  const router = Router();

  // Upload & create transcription
router.post(
  "/transcriptions",
  authRequired,
  upload.single("file"),
  asyncHandler(createTranscription)
);


  // (Optional) list current user's transcriptions
  router.get(
    "/transcriptions",
    authRequired,
    asyncHandler(myTranscriptions)
  );

  // ==== History endpoints expected by your UI ====
router.get("/history", authRequired, asyncHandler(listHistory));
router.post("/history", authRequired, asyncHandler(saveHistory));
router.delete("/history/:id", authRequired, asyncHandler(deleteHistory));


  return router;
}
