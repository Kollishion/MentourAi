import { Router } from "express";
import {
  mentor,
  processContentController,
  getNextActionController,
  diagnoseStudentController,
} from "./ai.controller";

const router = Router();

router.post("/mentor", mentor);
router.post("/process-content", processContentController);
router.post("/next-action", getNextActionController);
router.post("/diagnose", diagnoseStudentController);

export default router;
