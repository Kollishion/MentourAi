import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthContext";
import {
  diagnoseStudent,
  processContent,
  type DiagnoseResponse,
  type ProcessContentResponse,
} from "../lib/ai";

type FlowStep =
  | "ask-material"
  | "upload-material"
  | "material-processed"
  | "input-diagnostic"
  | "analyzing"
  | "show-result";

export default function Diagnose() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<FlowStep>("ask-material");

  // Material Upload State
  const [materialType, setMaterialType] = useState<string>("lecture_notes");
  const [sourceName, setSourceName] = useState<string>("Uploaded_Material.txt");
  const [materialText, setMaterialText] = useState<string>("");
  const [processingMaterial, setProcessingMaterial] = useState<boolean>(false);
  const [materialResult, setMaterialResult] = useState<ProcessContentResponse | null>(null);

  // Diagnostic State
  const [concept, setConcept] = useState<string>(searchParams.get("concept") || "python");
  const [question, setQuestion] = useState<string>("");
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(100);

  // Loading & Result State
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const conceptFromUrl = searchParams.get("concept");
    if (conceptFromUrl) {
      setConcept(conceptFromUrl);
    }
  }, [searchParams]);

  // Handle File Upload for Material
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceName(file.name);
    
    // Read text files directly
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setMaterialText(content);
      }
    };
    reader.readAsText(file);
  }

  async function handleProcessMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!materialText.trim()) {
      setError("Please paste or upload course material text.");
      return;
    }
    setProcessingMaterial(true);
    setError(null);
    try {
      const res = await processContent({
        student_id: user.id,
        text: materialText,
        material_type: materialType,
        source_name: sourceName,
      });
      setMaterialResult(res);
      setStep("material-processed");
    } catch (err: any) {
      console.error("Material process error:", err);
      setError(err?.message || "Failed to process course material.");
    } finally {
      setProcessingMaterial(false);
    }
  }

  async function handleStartDiagnostic(e: React.FormEvent) {
    e.preventDefault();
    const studentId = user?.id || "demo_student";
    setStep("analyzing");
    setError(null);

    try {
      const data = await diagnoseStudent({
        student_id: studentId,
        concept: concept || "python",
        question: question || `define ${concept || "python"} programming language.`,
        student_answer: studentAnswer,
        confidence: Number(confidence),
      });

      // Small delay to simulate analysis progress matching terminal output
      setTimeout(() => {
        setResult(data);
        setStep("show-result");
      }, 600);
    } catch (err: any) {
      console.error("Diagnosis Error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to run diagnostic. Please check AI backend connection.";
      setError(msg);
      setStep("input-diagnostic");
    }
  }

  function handleContinue() {
    if (result?.next_action) {
      // Proceed to learn page or dashboard with next action context
      navigate(`/learn?concept=${encodeURIComponent(result.diagnosis.concept)}`);
    } else {
      setStep("input-diagnostic");
    }
  }

  // Calibration level helper
  const isWellCalibrated = confidence >= 50;

  return (
    <div className="min-h-screen bg-[#0d0f17] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              MentourAI — Diagnostic Agent
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Interactive Agentic Evaluation & Course Alignment
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs text-red-400 hover:underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: Ask Course Material */}
        {step === "ask-material" && (
          <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
                Step 1: Course Material Context
              </span>
              <h2 className="text-xl font-bold text-gray-100">
                Do you want to upload/provide course material first? (y/n)
              </h2>
              <p className="text-sm text-gray-400">
                Uploading course materials (.pdf, syllabus, lecture notes) allows the Diagnostic Agent to ground tests against your specific curriculum.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStep("upload-material")}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
              >
                <span>Yes ('y')</span> — Upload / Provide Material
              </button>
              <button
                onClick={() => setStep("input-diagnostic")}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 font-semibold text-gray-200 transition border border-gray-700 flex items-center justify-center gap-2"
              >
                <span>No ('n')</span> — Continue with Diagnostic
              </button>
            </div>
          </div>
        )}

        {/* STEP 1.5: Upload Material Form */}
        {step === "upload-material" && (
          <form onSubmit={handleProcessMaterial} className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-100">Upload / Provide Course Material</h2>
              <button
                type="button"
                onClick={() => setStep("ask-material")}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Material Type
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full bg-[#0d0f17] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="lecture_notes">Notes / Lecture</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="past_exam_paper">Exam Paper</option>
                  <option value="textbook_chapter">Textbook Chapter</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Lecture1.pdf, Syllabus.txt"
                  className="w-full bg-[#0d0f17] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Upload File (.pdf / .txt / .md)
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={handleFileUpload}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-900/40 file:text-purple-300 hover:file:bg-purple-900/60 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Material Content Text
              </label>
              <textarea
                value={materialText}
                onChange={(e) => setMaterialText(e.target.value)}
                rows={5}
                placeholder="Paste the text content of your course material or upload a text file..."
                className="w-full bg-[#0d0f17] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 resize-none font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processingMaterial}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg"
              >
                {processingMaterial ? "[Content Agent] Extracting concept map..." : "Process Material & Continue"}
              </button>
              <button
                type="button"
                onClick={() => setStep("input-diagnostic")}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm"
              >
                Skip
              </button>
            </div>
          </form>
        )}

        {/* STEP 1.6: Material Processed Banner */}
        {step === "material-processed" && materialResult && (
          <div className="bg-[#161926] border border-green-800/60 rounded-2xl p-6 space-y-4 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-950 text-green-400 border border-green-700/50">
              ✓
            </div>
            <h2 className="text-lg font-bold text-gray-100">
              [Content Agent] Mapped {materialResult.concept_count} concepts into orchestrator learning state.
            </h2>
            <p className="text-xs text-gray-400">
              Course material extracted and integrated into your student learning profile.
            </p>
            <button
              onClick={() => setStep("input-diagnostic")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow-lg"
            >
              Continue to Diagnostic Form
            </button>
          </div>
        )}

        {/* STEP 2: Main Diagnostic Form */}
        {(step === "input-diagnostic" || step === "analyzing") && (
          <form onSubmit={handleStartDiagnostic} className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-semibold text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-800/40">
                  Targeting Concept for Diagnosis
                </span>
                <h2 className="text-lg font-bold text-gray-100 capitalize mt-2">
                  Concept: {concept}
                </h2>
              </div>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Change concept..."
                className="bg-[#0d0f17] border border-gray-700 text-xs px-3 py-1.5 rounded-lg text-gray-200 focus:outline-none focus:border-purple-500 w-36"
              />
            </div>

            {/* Question Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Enter a question about {concept}:
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`e.g. define ${concept} programming language.`}
                required
                className="w-full bg-[#0d0f17] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Student Answer Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Type your answer:
              </label>
              <textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                rows={4}
                placeholder="Write your explanation or answer here..."
                required
                className="w-full bg-[#0d0f17] border border-gray-700 rounded-xl p-4 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* Confidence Slider with Two Colour Levels (Red: under-confident, Green: well-calibrated) */}
            <div className="space-y-2 bg-[#0d0f17] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Enter your confidence level (0-100):
                </label>
                <div className="flex items-center gap-2">
                  {/* Two Colour Level Status Indicators */}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      !isWellCalibrated
                        ? "bg-red-950/80 text-red-400 border-red-800"
                        : "bg-green-950/80 text-green-400 border-green-800"
                    }`}
                  >
                    {!isWellCalibrated ? "Red (Under-confident)" : "Green (Well-calibrated)"}
                  </span>
                  <span className="text-sm font-extrabold text-white bg-gray-800 px-2.5 py-1 rounded-lg">
                    {confidence}%
                  </span>
                </div>
              </div>

              {/* Visual Indicator Track */}
              <div className="relative pt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                  <span className="text-red-400 font-bold">0% (Under-confident)</span>
                  <span className="text-yellow-400 font-bold">50%</span>
                  <span className="text-green-400 font-bold">100% (Well-calibrated)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={step === "analyzing"}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-xl flex items-center justify-center gap-2"
            >
              {step === "analyzing" ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Analyzing answer & confidence...</span>
                </>
              ) : (
                "Start Diagnostic"
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Show Result - Diagnostic Agent Result */}
        {step === "show-result" && result && (
          <div className="space-y-6">
            
            {/* Terminal Styled Output Header */}
            <div className="bg-[#0b0c10] border border-purple-900/60 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs font-bold text-gray-300 ml-2">Mentor OS Terminal Output</span>
                </div>
                <span className="text-[11px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                  Agent Result JSON
                </span>
              </div>

              {/* Exact Terminal Header Text */}
              <div className="text-purple-300 font-bold text-sm">
                --- Diagnostic Agent Result ---
              </div>

              {/* Formatted JSON Output matching backend/AI_Mentor/main.py */}
              <pre className="bg-[#12141d] p-4 rounded-xl text-green-400 text-xs sm:text-sm overflow-x-auto leading-relaxed border border-gray-800">
                {JSON.stringify(result.diagnosis, null, 2)}
              </pre>

              {/* Updated Mastery State Output */}
              <div className="pt-2 border-t border-gray-800 text-xs text-yellow-300 font-semibold flex items-center justify-between">
                <span>Updated Mastery State:</span>
                <code className="bg-yellow-950/40 text-yellow-400 px-2.5 py-1 rounded border border-yellow-800">
                  {JSON.stringify(result.updated_mastery)}
                </code>
              </div>
            </div>

            {/* Rich Visual Breakdown Card */}
            <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-100 capitalize">
                    {result.diagnosis.concept} Diagnosis Summary
                  </h3>
                  <p className="text-xs text-gray-400">Agentic evaluation breakdown</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-green-400">
                    {Math.round(result.diagnosis.mastery_score * 100)}%
                  </span>
                  <span className="block text-[10px] uppercase text-gray-400 font-semibold">
                    Mastery Score
                  </span>
                </div>
              </div>

              {/* Understood list */}
              {result.diagnosis.understood.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Understood Concepts
                  </h4>
                  <ul className="space-y-1.5">
                    {result.diagnosis.understood.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-200">
                        <span className="text-green-400 shrink-0 font-bold">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Misconceptions list */}
              {result.diagnosis.misconceptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Misconceptions Detected
                  </h4>
                  <ul className="space-y-1.5">
                    {result.diagnosis.misconceptions.map((m, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-red-300">
                        <span className="text-red-400 shrink-0 font-bold">✕</span>
                        <span>{m.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence Calibration */}
              <div className="bg-[#0d0f17] border border-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Confidence Calibration
                </h4>
                <div className="flex flex-wrap items-center justify-between text-sm gap-2">
                  <span className="text-gray-300">
                    Student Confidence: <strong className="text-white">{result.diagnosis.confidence_calibration.student_confidence}%</strong>
                  </span>
                  <span className="text-gray-300">
                    Estimated Understanding: <strong className="text-white">{result.diagnosis.confidence_calibration.estimated_actual_understanding}%</strong>
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      result.diagnosis.confidence_calibration.calibration === "underconfident"
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : "bg-green-950 text-green-400 border border-green-800"
                    }`}
                  >
                    {result.diagnosis.confidence_calibration.calibration.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Next Action & Instructions */}
              <div className="border-t border-gray-800 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recommended Next Action
                </h4>
                <p className="text-sm font-semibold text-purple-300 bg-purple-950/40 border border-purple-800/50 p-3 rounded-xl">
                  {result.diagnosis.next_action}
                </p>

                {result.diagnosis.instructions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Instructions
                    </span>
                    <ol className="space-y-1.5">
                      {result.diagnosis.instructions.map((inst, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-purple-400 font-bold">{i + 1}.</span>
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-xl"
              >
                Continue
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
