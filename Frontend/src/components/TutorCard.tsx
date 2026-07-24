import type { TutorResponse } from "../lib/ai";

export default function TutorCard({ tutor }: { tutor: TutorResponse }) {
  return (
    <div className="space-y-4 text-sm text-text">
      <Section title="Explanation">{tutor.explanation}</Section>
      <Section title="Analogy">{tutor.analogy}</Section>
      <Section title="Think">{tutor.socratic_question}</Section>
      {tutor.guided_steps.length > 0 && (
        <Section title="Steps">
          <ol className="space-y-2 list-none">
            {tutor.guided_steps.map((step, i) => (
              <li key={i}>
                <span className="text-primary font-medium">{i + 1}. {step.title}</span>
                <p className="text-text-muted mt-0.5">{step.explanation}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}
      <Section title="Practice">{tutor.practice_question}</Section>
      <Section title="Encouragement">
        <span className="text-success">{tutor.encouragement}</span>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-1">{title}</p>
      <div className="leading-6">{children}</div>
    </div>
  );
}
