import axios from "axios";
import { API } from "./api";

export interface Misconception {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface ConfidenceCalibration {
  student_confidence: number;
  estimated_actual_understanding: number;
  calibration: "well_calibrated" | "overconfident" | "underconfident";
}

export interface DiagnosticResult {
  concept: string;
  mastery_score: number; // 0.0–1.0
  understood: string[];
  misconceptions: Misconception[];
  confidence_calibration: ConfidenceCalibration;
  next_action: string;
  instructions: string[];
}

export interface TutorStep {
  title: string;
  explanation: string;
}

export interface TutorResponse {
  teaching_strategy: string;
  misconceptions: string;
  explanation: string;
  socratic_question: string;
  analogy: string;
  thinking_time_seconds: number | null;
  guided_steps: TutorStep[];
  practice_question: string;
  encouragement: string;
}

export type NextActionType = "remediate_prerequisite" | "run_diagnostic" | "transfer_problem";

export interface NextActionDecision {
  action: NextActionType;
  concept: string;
  reason: string;
}

export interface DiagnoseResponse {
  student_id: string;
  concept: string;
  diagnosis: DiagnosticResult;
  tutoring: TutorResponse | null;
  updated_mastery: Record<string, number>;
  next_action: NextActionDecision;
}

export interface NextActionResponse {
  student_id: string;
  decision: NextActionDecision;
}

export interface MaterialRequest {
  student_id: string;
  text: string;
  material_type?: "Syllabus" | "Notes" | "Exam Paper" | "Lecture" | "other" | string;
  source_name?: string;
}

export interface ProcessContentResponse {
  message: string;
  student_id: string;
  concept_count: number;
  content_map: any;
}

export async function getNextAction(student_id: string, target_concept: string): Promise<NextActionResponse> {
  const res = await axios.post(API.AI.NEXT_ACTION, { student_id, target_concept }, { withCredentials: true });
  return res.data;
}

export async function diagnoseStudent(payload: {
  student_id: string;
  concept: string;
  question: string;
  student_answer: string;
  confidence: number;
}): Promise<DiagnoseResponse> {
  const res = await axios.post(API.AI.DIAGNOSE, payload, { withCredentials: true });
  return res.data;
}

export async function processContent(payload: MaterialRequest): Promise<ProcessContentResponse> {
  const res = await axios.post(API.AI.PROCESS_CONTENT, payload, { withCredentials: true });
  return res.data;
}

