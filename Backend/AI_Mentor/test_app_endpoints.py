import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app import app, student_states


def test_fastapi_endpoints():
    print("==================================================")
    print("      TESTING FASTAPI MULTI-AGENT ENDPOINTS       ")
    print("==================================================")

    client = TestClient(app)

    # 1. Test Root Endpoint
    print("\n1. Testing GET / ...")
    res_root = client.get("/")
    assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
    print(f"   [PASS] Response: {res_root.json()}")

    # 2. Test Next Best Action before adding content/mastery
    print("\n2. Testing POST /api/learning/next-action (New Student)...")
    res_action = client.post("/api/learning/next-action", json={
        "student_id": "student_api_test",
        "target_concept": "Dynamic Programming"
    })
    assert res_action.status_code == 200, f"Expected 200, got {res_action.status_code}"
    data_action = res_action.json()
    print(f"   [PASS] Decision for untracked topic: {data_action['decision']}")
    assert data_action["decision"]["action"] == "run_diagnostic"

    # 3. Test Student State Endpoint
    print("\n3. Testing GET /api/student/student_api_test ...")
    res_state = client.get("/api/student/student_api_test")
    assert res_state.status_code == 200
    print(f"   [PASS] Student state retrieved: {res_state.json()}")

    print("\n==================================================")
    print(" ALL FASTAPI ENDPOINT UNIT TESTS PASSED CLEANLY!  ")
    print("==================================================")


if __name__ == "__main__":
    test_fastapi_endpoints()
