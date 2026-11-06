#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p tools
curl --fail --location --proto '=https' --tlsv1.2 \
  https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.40.0/ecj-3.40.0.jar \
  -o tools/ecj-3.40.0.jar.download
python3 - <<'PY'
import hashlib, pathlib
p = pathlib.Path('tools/ecj-3.40.0.jar.download')
if hashlib.sha256(p.read_bytes()).hexdigest() != '05cc22a24e7982970f63a405fc6c820bc80b806f27f3c5a6236fc475f8f7152b':
    p.unlink()
    raise SystemExit('Compiler artifact checksum mismatch')
p.replace('tools/ecj-3.40.0.jar')
PY
