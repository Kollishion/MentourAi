import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthContext";
import {
  getNextAction,
  diagnoseStudent,
  processContent,
  type NextActionDecision,
  type DiagnoseResponse,
  type ProcessContentResponse,
} from "../lib/ai";

type Stage =
  | "ask-material"
  | "upload-material"
  | "material-processed"
  | "pick-concept"
  | "loading"
  | "needs-answer"
  | "result"
  | "transfer";

export default function Learn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [targetConcept, setTargetConcept] = useState(searchParams.get("concept") ?? "");
  const [stage, setStage] = useState<Stage>("ask-material");
  const [decision, setDecision] = useState<NextActionDecision | null>(null);

  // Material Upload State
  const [materialType, setMaterialType] = useState<string>("lecture_notes");
  const [sourceName, setSourceName] = useState<string>("Uploaded_Material.txt");
  const [materialText, setMaterialText] = useState<string>("");
  const [processingMaterial, setProcessingMaterial] = useState<boolean>(false);
  const [materialResult, setMaterialResult] = useState<ProcessContentResponse | null>(null);

  // Diagnostic State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(100);
  const [submittingDiag, setSubmittingDiag] = useState(false);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("concept");
    if (fromUrl) {
      setTargetConcept(fromUrl);
    }
  }, [searchParams]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceName(file.name);
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
    if (!materialText.trim()) {
      setError("Please paste or upload course material text.");
      return;
    }
    setProcessingMaterial(true);
    setError(null);
    try {
      const studentId = user?.id || "demo_student";
      const res = await processContent({
        student_id: studentId,
        text: materialText,
        material_type: materialType,
        source_name: sourceName,
      });
      setMaterialResult(res);
      setStage("material-processed");
    } catch (err: any) {
      console.error("Material upload error:", err);
      setError(err?.message || "Failed to process course material.");
    } finally {
      setProcessingMaterial(false);
    }
  }

  async function startLearning(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!targetConcept.trim()) return;
    await runNextAction(targetConcept);
  }

  async function runNextAction(concept: string) {
    const studentId = user?.id || "demo_student";
    setStage("loading");
    setError(null);
    try {
      const res = await getNextAction(studentId, concept);
      setDecision(res.decision);
      if (res.decision.action === "transfer_problem") {
        setStage("transfer");
      } else {
        setQuestion("");
        setAnswer("");
        setResult(null);
        setStage("needs-answer");
      }
    } catch (err: any) {
      console.error("Next Action Error Detail:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Couldn't reach the mentor. Try again.";
      setError(msg);
      setStage("pick-concept");
    }
  }

  async function submitDiagnosis(e: React.FormEvent) {
    e.preventDefault();
    const studentId = user?.id || "demo_student";
    const conceptToDiagnose = decision?.concept || targetConcept || "python";

    setSubmittingDiag(true);
    setError(null);

    try {
      const res = await diagnoseStudent({
        student_id: studentId,
        concept: conceptToDiagnose,
        question: question || `define ${conceptToDiagnose} programming language.`,
        student_answer: answer,
        confidence: Number(confidence),
      });

      setResult(res);
      setStage("result");
    } catch (err: any) {
      console.error("Diagnosis Error Detail:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Diagnosis failed. Try again.";
      setError(msg);
      setStage("needs-answer");
    } finally {
      setSubmittingDiag(false);
    }
  }

  function continueLoop() {
    if (targetConcept) {
      runNextAction(targetConcept);
    } else {
      setStage("pick-concept");
    }
  }

  const isWellCalibrated = confidence >= 50;

  return (
    <div className="min-h-screen bg-[#0d0f17] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              MentourAI — Learning Agent
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Agentic Orchestrator & Diagnostic Assessment
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
        {stage === "ask-material" && (
          <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
                Course Context Prompt
              </span>
              <h2 className="text-xl font-bold text-gray-100">
                Do you want to upload/provide course material first? (y/n)
              </h2>
              <p className="text-sm text-gray-400">
                Provide course materials (.pdf, syllabus, notes) to help the agent extract concept maps and tailor your diagnostics.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStage("upload-material")}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
              >
                <span>Yes ('y')</span> — Upload / Provide Material
              </button>
              <button
                onClick={() => setStage("pick-concept")}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 font-semibold text-gray-200 transition border border-gray-700 flex items-center justify-center gap-2"
              >
                <span>No ('n')</span> — Continue to Next Steps
              </button>
            </div>
          </div>
        )}

        {/* STEP 1.5: Upload Material Form */}
        {stage === "upload-material" && (
          <form onSubmit={handleProcessMaterial} className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-100">Upload / Provide Course Material</h2>
              <button
                type="button"
                onClick={() => setStage("ask-material")}
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
                Upload Document File (.pdf / .txt / .md)
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
                placeholder="Paste the text content of your course material or upload a file..."
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
                onClick={() => setStage("pick-concept")}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm"
              >
                Skip
              </button>
            </div>
          </form>
        )}

        {/* STEP 1.6: Material Processed */}
        {stage === "material-processed" && materialResult && (
          <div className="bg-[#161926] border border-green-800/60 rounded-2xl p-6 space-y-4 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-950 text-green-400 border border-green-700/50">
              ✓
            </div>
            <h2 className="text-lg font-bold text-gray-100">
              [Content Agent] Mapped {materialResult.concept_count} concepts into orchestrator learning state.
            </h2>
            <button
              onClick={() => setStage("pick-concept")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow-lg"
            >
              Continue to Target Concept
            </button>
          </div>
        )}

        {/* STEP 2: Pick Concept */}
        {stage === "pick-concept" && (
          <form onSubmit={startLearning} className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                What concept/topic do you want to work on?
              </label>
              <input
                value={targetConcept}
                onChange={(e) => setTargetConcept(e.target.value)}
                placeholder="e.g. python, recursion, dynamic programming"
                required
                className="w-full bg-[#0d0f17] border border-gray-700 text-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500"
              />
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl py-3 text-sm transition shadow-lg">
              Start Learning Action
            </button>
          </form>
        )}

        {/* Loading State */}
        {stage === "loading" && (
          <div className="bg-[#161926] border border-gray-800 rounded-2xl p-8 text-center text-gray-300 space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-medium">Analyzing concept state & running orchestrator...</p>
          </div>
        )}

        {/* Transfer Problem State */}
        {stage === "transfer" && decision && (
          <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-950 text-green-400 border border-green-800 font-bold uppercase tracking-wider">
              Concept Mastered
            </span>
            <p className="text-sm text-gray-200">{decision.reason}</p>
            <button
              onClick={() => setStage("pick-concept")}
              className="w-full border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors rounded-xl py-2.5 text-sm font-semibold"
            >
              Try a new concept
            </button>
          </div>
        )}

        {/* Diagnostic Form Input */}
        {stage === "needs-answer" && decision && (
          <form onSubmit={submitDiagnosis} className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="border-b border-gray-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
                Targeting concept for diagnosis: {decision.concept}
              </span>
              <p className="text-xs text-gray-400 mt-2">{decision.reason}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Enter a question about {decision.concept}:
              </label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`e.g. define ${decision.concept} programming language.`}
                required
                className="w-full bg-[#0d0f17] border border-gray-700 text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Type your answer:
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                placeholder="Type your explanation or answer..."
                required
                className="w-full bg-[#0d0f17] border border-gray-700 text-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* Confidence Slider with Red & Green Levels */}
            <div className="space-y-2 bg-[#0d0f17] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Enter your confidence level (0-100):
                </label>
                <div className="flex items-center gap-2">
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
              disabled={submittingDiag}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-xl flex items-center justify-center gap-2"
            >
              {submittingDiag ? (
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

        {/* STEP 3: Terminal Response & Diagnosis Result */}
        {stage === "result" && result && (
          <div className="space-y-6">
            
            {/* Terminal Window Box */}
            <div className="bg-[#0b0c10] border border-purple-900/60 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs font-bold text-gray-300 ml-2">Mentor OS Terminal Output</span>
                </div>
                <span className="text-[11px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                  main.py Result Format
                </span>
              </div>

              <div className="text-purple-300 font-bold text-sm">
                --- Diagnostic Agent Result ---
              </div>

              <pre className="bg-[#12141d] p-4 rounded-xl text-green-400 text-xs sm:text-sm overflow-x-auto leading-relaxed border border-gray-800">
                {JSON.stringify(result.diagnosis, null, 2)}
              </pre>

              <div className="pt-2 border-t border-gray-800 text-xs text-yellow-300 font-semibold flex items-center justify-between">
                <span>Updated Mastery State:</span>
                <code className="bg-yellow-950/40 text-yellow-400 px-2.5 py-1 rounded border border-yellow-800">
                  {JSON.stringify(result.updated_mastery)}
                </code>
              </div>
            </div>

            {/* Structured Card */}
            <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-gray-100 capitalize">
                  {result.diagnosis.concept} Diagnostic Breakdown
                </h3>
                <span className="text-2xl font-extrabold text-green-400">
                  {Math.round(result.diagnosis.mastery_score * 100)}% Mastery
                </span>
              </div>

              {result.diagnosis.understood.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Understood</h4>
                  <ul className="space-y-1">
                    {result.diagnosis.understood.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-200">
                        <span className="text-green-400 font-bold">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.diagnosis.misconceptions.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Misconceptions</h4>
                  {result.diagnosis.misconceptions.map((m, i) => (
                    <div key={i} className="flex gap-2 text-sm text-red-300">
                      <span className="text-red-400 font-bold">✕</span> {m.description}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-800 pt-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Next Action</h4>
                <p className="text-sm font-semibold text-purple-300">{result.diagnosis.next_action}</p>
              </div>

              {/* Continue Button */}
              <button
                onClick={continueLoop}
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
