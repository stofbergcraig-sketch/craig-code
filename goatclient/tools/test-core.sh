#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import hashlib, pathlib
p = pathlib.Path('tools/ecj-3.40.0.jar')
expected = '05cc22a24e7982970f63a405fc6c820bc80b806f27f3c5a6236fc475f8f7152b'
# Artifact was verified against Maven Central's published checksum during setup.
if hashlib.sha256(p.read_bytes()).hexdigest() != expected:
    raise SystemExit('Compiler artifact checksum mismatch')
PY
mkdir -p build/core-classes
java -jar tools/ecj-3.40.0.jar -source 1.8 -target 1.8 -proc:none -d build/core-classes src/main/java/dev/goatclient/core/*.java src/test/java/dev/goatclient/core/*.java
java -cp build/core-classes dev.goatclient.core.CoreTest
