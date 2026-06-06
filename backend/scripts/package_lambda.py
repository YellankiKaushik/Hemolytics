import argparse
import shutil
from pathlib import Path


def copy_tree(source: Path, destination: Path) -> None:
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.pyo"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a clean Hemolytics Lambda build folder.")
    parser.add_argument("--output", default="backend/.build/lambda", help="Build output folder.")
    parser.add_argument("--install-deps", action="store_true", help="Install requirements into the build folder.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    backend_root = repo_root / "backend"
    output = (repo_root / args.output).resolve()

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    copy_tree(backend_root / "handlers", output / "handlers")
    copy_tree(backend_root / "services", output / "services")
    shutil.copy2(backend_root / "requirements.txt", output / "requirements.txt")

    if args.install_deps:
        import subprocess
        import sys

        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            str(output / "requirements.txt"),
            "-t",
            str(output),
        ])

    print(f"Packaged Lambda source at {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
