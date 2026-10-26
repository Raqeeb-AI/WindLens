import json
from backend.app.main import app

def export_openapi():
    openapi_schema = app.openapi()
    with open("backend/openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print("Successfully exported openapi.json to backend/openapi.json")

if __name__ == "__main__":
    export_openapi()
