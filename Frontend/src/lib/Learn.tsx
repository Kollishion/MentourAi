import { useState } from "react";
import { useAuthStore } from "../store/AuthContext";
import {
  getNextAction,
  diagnoseStudent,
  type NextActionDecision,
  type DiagnoseResponse,
} from "../lib/ai";

type Stage = "pick-concept" | "loading" | "needs-answer" | "result" | "transfer";

export default function Learn() {
  const user = useAuthStore((s) => s.user);
  const [targetConcept, setTargetConcept] = useState("");
  const [stage, setStage] = useState<Stage>("pick-concept");
  const [decision, setDecision] = useState<NextActionDecision | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startLearning(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !targetConcept.trim()) return;
    await runNextAction(targetConcept);
  }

  async function runNextAction(concept: string) {
    if (!user) return;
    setStage("loading");
    setError(null);
    try {
      const res = await getNextAction(user.id, concept);
      setDecision(res.decision);
      if (res.decision.action === "transfer_problem") {
        setStage("transfer");
      } else {
        // both "remediate_prerequisite" and "run_diagnostic" need a question
        setQuestion("");
        setAnswer("");
        setResult(null);
        setStage("needs-answer");
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the mentor. Try again.");
      setStage("pick-concept");
    }
  }

  async function submitDiagnosis(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !decision) return;
    setStage("loading");
    setError(null);
    try {
      const res = await diagnoseStudent({
        student_id: user.id,
        concept: decision.concept,
        question,
        student_answer: answer,
        confidence,
      });
      setResult(res);
      setStage("result");
    } catch (err) {
      console.error(err);
      setError("Diagnosis failed. Try again.");
      setStage("needs-answer");
    }
  }

  function continueLoop() {
    if (targetConcept) runNextAction(targetConcept);
  }

  return (
    <div className="min-h-screen bg-background text-text px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold purple-fade-text mb-1">Learn</h1>
          <p className="text-text-muted text-sm">Your mentor decides the next best step</p>
        </div>

        {stage === "pick-concept" && (
          <form onSubmit={startLearning} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                What do you want to learn?
              </label>
              <input
                value={targetConcept}
                onChange={(e) => setTargetConcept(e.target.value)}
                placeholder="e.g. dynamic programming"
                required
                className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5">
              Start
            </button>
          </form>
        )}

        {stage === "loading" && (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
            Thinking...
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {stage === "transfer" && decision && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-success/10 text-success">
              Mastered
            </span>
            <p className="text-sm text-text">{decision.reason}</p>
            <button
              onClick={() => setStage("pick-concept")}
              className="w-full border border-border-light text-text hover:bg-surface-2 transition-colors rounded-lg py-2 text-sm font-medium"
            >
              Try a new concept
            </button>
          </div>
        )}

        {stage === "needs-answer" && decision && (
          <form onSubmit={submitDiagnosis} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-surface-2 text-text-muted mb-2">
                {decision.action === "remediate_prerequisite" ? "Prerequisite check" : "Diagnostic"}
              </span>
              <p className="text-sm text-text-muted">{decision.reason}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Question about {decision.concept}
              </label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`e.g. what is ${decision.concept}?`}
                required
                className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Your answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                required
                className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium text-text-muted mb-1.5">
                <span>Confidence</span>
                <span className="text-text">{confidence}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <button className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5">
              Submit
            </button>
          </form>
        )}

        {stage === "result" && result && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold capitalize">{result.diagnosis.concept}</h2>
                <span className="text-sm font-semibold text-text">
                  {Math.round(result.diagnosis.mastery_score * 100)}% mastery
                </span>
              </div>

              {result.diagnosis.understood.length > 0 && (
                <ul className="space-y-1.5">
                  {result.diagnosis.understood.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text">
                      <span className="text-success shrink-0">✓</span>{p}
                    </li>
                  ))}
                </ul>
              )}

              {result.diagnosis.misconceptions.length > 0 && (
                <div className="space-y-1.5">
                  {result.diagnosis.misconceptions.map((m, i) => (
                    <div key={i} className="flex gap-2 text-sm text-text">
                      <span className="text-error shrink-0">✕</span>
                      <span>
                        {m.description}
                        <span className="ml-2 text-xs text-text-subtle">({m.severity})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.tutoring && (
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Tutoring
                </span>
                <p className="text-sm text-text">{result.tutoring.explanation}</p>

                <div className="bg-surface-2 rounded-lg p-4">
                  <p className="text-xs text-text-muted mb-1">Think about this</p>
                  <p className="text-sm text-text">{result.tutoring.socratic_question}</p>
                </div>

                {result.tutoring.guided_steps.length > 0 && (
                  <ol className="space-y-2">
                    {result.tutoring.guided_steps.map((step, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-primary font-medium">{i + 1}. {step.title}</span>
                        <p className="text-text-muted mt-0.5">{step.explanation}</p>
                      </li>
                    ))}
                  </ol>
                )}

                <p className="text-sm text-text-muted italic">{result.tutoring.analogy}</p>
                <p className="text-sm text-text">{result.tutoring.practice_question}</p>
                <p className="text-sm text-success">{result.tutoring.encouragement}</p>
              </div>
            )}

            <button
              onClick={continueLoop}
              className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
