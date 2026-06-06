import importlib
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json")
        return 2

    backend_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_root))

    module_name = sys.argv[1]
    event_path = Path(sys.argv[2])
    with event_path.open("r", encoding="utf-8") as event_file:
        event = json.load(event_file)

    module = importlib.import_module(module_name)
    result = module.lambda_handler(event, None)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
