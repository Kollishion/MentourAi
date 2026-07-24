from schemas.state import StudentState
from schemas.content import MaterialInput
from agents.content_agent import content_agent
from agents.orchestrator import load_content_map, next_best_action, run_diagnostic_and_teach


def main():
    print("==================================================")
    print("             MENTOR OS - AGENTIC LEARNING         ")
    print("==================================================")
    state = StudentState(student_id="demo_student")

    # Optional: Load course material / syllabus
    load_mat = input("Do you want to upload/provide course material first? (y/n): ").strip().lower()
    if load_mat == "y":
        mat_type = input("Material type (Syllabus/Notes/Exam Paper/Lecture): ").strip() or "Notes"
        source = input("Source name (e.g. Lecture1.pdf, Syllabus.txt): ").strip() or "Uploaded_Material"
        print("Paste the text content of the material (press Enter twice to finish):")
        lines = []
        while True:
            line = input()
            if not line:
                break
            lines.append(line)
        raw_text = "\n".join(lines)
        if raw_text.strip():
            print("\n[Content Agent] Extracting concept map...")
            content_map = content_agent([MaterialInput(text=raw_text, material_type=mat_type, source_name=source)])
            load_content_map(state, content_map)
            print(f"[Content Agent] Mapped {len(content_map.concepts)} concepts into orchestrator learning state.")

    target_concept = input("\nWhat concept/topic do you want to work on? ").strip()
    if not target_concept:
        print("No concept specified. Exiting.")
        return

    decision = next_best_action(state, target_concept)
    print("\n[Orchestrator Decision]:", decision)

    concept_to_diagnose = decision["concept"]

    if decision["action"] in ("remediate_prerequisite", "run_diagnostic"):
        print(f"\nTargeting concept for diagnosis: {concept_to_diagnose}")
        question = input(f"Enter a question about {concept_to_diagnose}: ")
        student_answer = input("Type your answer: ")
        conf_str = input("Enter your confidence level (0-100): ").strip()
        confidence = float(conf_str) if conf_str else 50.0

        print("\n[Diagnostic Agent] Analyzing answer & confidence...")
        diagnosis, tutoring = run_diagnostic_and_teach(
            state,
            concept=concept_to_diagnose,
            question=question,
            student_answer=student_answer,
            confidence=confidence,
        )

        print("\n--- Diagnostic Agent Result ---")
        print(diagnosis.model_dump_json(indent=2))
        if tutoring:
            print("\n--- Tutor Agent Intervention (Recovery Plan) ---")
            print(tutoring.model_dump_json(indent=2))

        print("\nUpdated Mastery State:", state.concept_mastery)
        print("Next Best Action:", next_best_action(state, target_concept))
    else:
        print(f"\n{concept_to_diagnose} mastery looks solid - ready for a transfer problem.")


if __name__ == "__main__":
    main()