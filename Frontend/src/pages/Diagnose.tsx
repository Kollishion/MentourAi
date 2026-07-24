import { useState } from "react";
import { diagnoseStudent, type DiagnoseResponse } from "../lib/ai";
import { useAuthStore } from "../store/AuthContext";

export default function Diagnose() {
  const user = useAuthStore((s) => s.user);
  const [concept, setConcept] = useState("");
  const [question, setQuestion] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await diagnoseStudent({
        student_id: user.id,
        concept,
        question,
        student_answer: studentAnswer,
        confidence,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to get diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold purple-fade-text mb-1">Concept check</h1>
          <p className="text-text-muted text-sm">
            Answer a question and get a breakdown of your understanding
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Concept</label>
            <input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. recursion"
              required
              className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. what is recursion?"
              required
              className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Your answer</label>
            <textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              rows={4}
              required
              className="w-full bg-surface-2 border border-border text-text placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-text-muted mb-1.5">
              <span>How confident are you?</span>
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

          <button
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Diagnosing..." : "Check my understanding"}
          </button>

          {error && <p className="text-sm text-error">{error}</p>}
        </form>

        {result && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize">{result.diagnosis.concept}</h2>
              <MasteryBadge score={result.diagnosis.mastery_score} />
            </div>

            {result.diagnosis.understood.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-2">What you understood</h3>
                <ul className="space-y-1.5">
                  {result.diagnosis.understood.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text">
                      <span className="text-success shrink-0">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.diagnosis.misconceptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-2">Misconceptions</h3>
                <ul className="space-y-1.5">
                  {result.diagnosis.misconceptions.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text">
                      <span className="text-error shrink-0">✕</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-text-muted mb-2">Confidence calibration</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-muted">
                  You: <span className="text-text">{result.diagnosis.confidence_calibration.student_confidence}%</span>
                </span>
                <span className="text-text-muted">
                  Actual: <span className="text-text">{result.diagnosis.confidence_calibration.estimated_actual_understanding}%</span>
                </span>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-surface-2 text-text-muted capitalize">
                  {result.diagnosis.confidence_calibration.calibration.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-text-muted mb-2">Next step</h3>
              <p className="text-sm text-text mb-3">{result.diagnosis.next_action}</p>
              <ul className="space-y-1.5">
                {result.diagnosis.instructions.map((step, i) => (
                  <li key={i} className="text-sm text-text-muted flex gap-2">
                    <span className="text-primary shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MasteryBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-error";
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {pct}% mastery
    </span>
  );
}
