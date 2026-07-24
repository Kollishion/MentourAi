import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from schemas.state import StudentState
from schemas.content import MaterialInput
from agents.content_agent import content_agent
from agents.orchestrator import load_content_map, next_best_action, run_diagnostic_and_teach


def test_live_agent_pipeline():
    print("==================================================")
    print("      RUNNING REAL-TIME AGENT PIPELINE TEST       ")
    print("==================================================")

    # 1. Content Agent parsing course material & syllabus
    print("\n1. Running Content Agent on Syllabus & Lecture Notes...")
    syllabus_input = MaterialInput(
        text="Course: Advanced Algorithms. Topic 1: Recursion (Base cases, Call Stack). Topic 2: Dynamic Programming (Memoization, Tabulation). Dynamic Programming requires strong understanding of Recursion.",
        material_type="Syllabus",
        source_name="CS201_Syllabus.pdf"
    )

    content_map = content_agent([syllabus_input])
    print(f"   - Extracted Subject: {content_map.subject}")
    print(f"   - Extracted {len(content_map.concepts)} Concepts:")
    for concept in content_map.concepts:
        print(f"     * {concept.name} (Prereqs: {concept.prerequisites})")

    # 2. Initialize Student State & Load Content Map
    print("\n2. Loading Content Map into Student State & Orchestrator...")
    state = StudentState(student_id="student_live_demo")
    load_content_map(state, content_map)

    # 3. Check Next Best Action for Dynamic Programming
    action_dec = next_best_action(state, "Dynamic Programming")
    print(f"   - Orchestrator Action Decision: {action_dec}")

    # 4. Run Diagnostic & Tutor Agents on a sample student response
    print("\n3. Running Diagnostic Agent & Tutor Agent...")
    concept = "Recursion"
    question = "Why does a recursive function cause a StackOverflowError?"
    student_answer = "Because it loops forever without stopping, but I don't know what a call stack is."
    confidence = 75.0

    diagnosis, tutoring = run_diagnostic_and_teach(
        state,
        concept=concept,
        question=question,
        student_answer=student_answer,
        confidence=confidence
    )

    print("\n--- Diagnostic Agent Result ---")
    print(f"Concept: {diagnosis.concept}")
    print(f"Mastery Score: {diagnosis.mastery_score}")
    print(f"Misconceptions: {[m.description for m in diagnosis.misconceptions]}")
    print(f"Confidence Calibration: {diagnosis.confidence_calibration.calibration}")

    if tutoring:
        print("\n--- Tutor Agent Intervention (Recovery Plan) ---")
        print(f"Strategy Used: {tutoring.teaching_strategy}")
        print(f"Explanation: {tutoring.explanation}")
        print(f"Analogy: {tutoring.analogy}")
        print(f"Socratic Question: {tutoring.socratic_question}")
        print(f"Practice Question: {tutoring.practice_question}")

    print("\n==================================================")
    print(" LIVE MULTI-AGENT PIPELINE TEST COMPLETED SUCCESSFULLY! ")
    print("==================================================")


if __name__ == "__main__":
    test_live_agent_pipeline()
