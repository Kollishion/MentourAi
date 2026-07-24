import sys
import os

# Add backend/AI_Mentor to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from schemas.state import StudentState
from schemas.content import MaterialInput, ContentMap, ConceptNode, Subtopic
from agents.content_agent import merge_content_maps
from agents.orchestrator import next_best_action, load_content_map, MASTERY_GATE
from schemas.diagnostic import DiagnosticResult, Misconception, ConfidenceCalibration
from agents.tutor_agents import choose_teaching_strategy


def test_content_merging():
    print("\n--- Testing Content Merging ---")
    map1 = ContentMap(
        subject="Computer Science",
        concepts=[
            ConceptNode(
                name="Recursion",
                subtopics=[Subtopic(name="Base Case", description="Stopping condition")],
                prerequisites=[],
                importance=0.8,
                exam_frequency=2,
            ),
            ConceptNode(
                name="Dynamic Programming",
                subtopics=[Subtopic(name="Memoization", description="Top-down caching")],
                prerequisites=["Recursion"],
                importance=0.9,
                exam_frequency=3,
            )
        ]
    )

    map2 = ContentMap(
        subject="Computer Science",
        concepts=[
            ConceptNode(
                name="Recursion",
                subtopics=[Subtopic(name="Stack Frame", description="Call stack memory")],
                prerequisites=[],
                importance=0.7,
                exam_frequency=1,
            )
        ]
    )

    merged = merge_content_maps([map1, map2])
    assert len(merged.concepts) == 2, f"Expected 2 merged concepts, got {len(merged.concepts)}"
    recursion_node = next(c for c in merged.concepts if c.name == "Recursion")
    assert len(recursion_node.subtopics) == 2, f"Expected 2 subtopics for Recursion, got {len(recursion_node.subtopics)}"
    assert recursion_node.exam_frequency == 3, f"Expected exam_frequency 3, got {recursion_node.exam_frequency}"
    print("[PASS] Content Map Merging logic verified!")


def test_orchestrator_prerequisite_gate():
    print("\n--- Testing Orchestrator Prerequisite Gate ---")
    state = StudentState(student_id="student_101")
    state.prerequisites["Dynamic Programming"] = ["Recursion"]

    # Recursion not mastered yet (0.0 < 0.6)
    action = next_best_action(state, "Dynamic Programming")
    assert action["action"] == "remediate_prerequisite", f"Expected remediate_prerequisite, got {action['action']}"
    assert action["concept"] == "Recursion"
    print(f"[PASS] Gate correctly blocked DP because Recursion mastery was 0%: {action['reason']}")

    # Now simulate mastering Recursion (0.8 >= 0.6)
    state.concept_mastery["Recursion"] = 0.8
    action2 = next_best_action(state, "Dynamic Programming")
    assert action2["action"] == "run_diagnostic", f"Expected run_diagnostic, got {action2['action']}"
    print(f"[PASS] Gate unblocked DP after Recursion was mastered: {action2['reason']}")


def test_tutor_strategy():
    print("\n--- Testing Tutor Strategy Selector ---")
    assert choose_teaching_strategy(0.2) == "analogy"
    assert choose_teaching_strategy(0.5) == "guided_practice"
    assert choose_teaching_strategy(0.8) == "application"
    assert choose_teaching_strategy(0.95) == "challenge_problem"
    print("[PASS] Tutor strategy selection verified across mastery thresholds!")


if __name__ == "__main__":
    print("Starting automated pipeline unit tests...")
    test_content_merging()
    test_orchestrator_prerequisite_gate()
    test_tutor_strategy()
    print("\n==========================================")
    print(" ALL PIPELINE UNIT TESTS PASSED SUCCESSFULLY!")
    print("==========================================")
