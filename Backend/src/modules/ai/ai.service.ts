import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function askMentor(prompt: string, payload?: Record<string, any>) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/mentor`, {
      prompt,
      ...payload,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error communicating with Python AI Service:", error?.message || error);
    throw new Error(error?.response?.data?.detail || error?.message || "AI Service unavailable");
  }
}

export async function processContent(data: {
  student_id: string;
  text: string;
  material_type?: string;
  source_name?: string;
}) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/content/process`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error in processContent:", error?.message || error);
    throw new Error(error?.response?.data?.detail || error?.message || "AI Content processing failed");
  }
}

export async function getNextAction(studentId: string, targetConcept: string) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/learning/next-action`, {
      student_id: studentId,
      target_concept: targetConcept,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error in getNextAction:", error?.message || error);
    throw new Error(error?.response?.data?.detail || error?.message || "AI Orchestrator action failed");
  }
}

export async function diagnoseStudent(data: {
  student_id: string;
  concept: string;
  question: string;
  student_answer: string;
  confidence?: number;
}) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/learning/diagnose`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error in diagnoseStudent:", error?.message || error);
    throw new Error(error?.response?.data?.detail || error?.message || "AI Diagnosis failed");
  }
}
