import type { Request, Response } from "express";
import { askMentor, processContent, getNextAction, diagnoseStudent } from "./ai.service";

export async function mentor(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, student_id, concept, question, student_answer, confidence } = req.body;
    const result = await askMentor(prompt, {
      student_id,
      concept,
      question,
      student_answer,
      confidence,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to communicate with AI Mentor service",
    });
  }
}

export async function processContentController(req: Request, res: Response): Promise<void> {
  try {
    const { student_id, text, material_type, source_name } = req.body;
    const result = await processContent({ student_id, text, material_type, source_name });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to process content material",
    });
  }
}

export async function getNextActionController(req: Request, res: Response): Promise<void> {
  try {
    const { student_id, target_concept } = req.body;
    const result = await getNextAction(student_id, target_concept);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch next learning action",
    });
  }
}

export async function diagnoseStudentController(req: Request, res: Response): Promise<void> {
  try {
    const { student_id, concept, question, student_answer, confidence } = req.body;
    const result = await diagnoseStudent({ student_id, concept, question, student_answer, confidence });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to diagnose student response",
    });
  }
}
