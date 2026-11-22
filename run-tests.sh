#!/bin/sh
# Fresh-clone tests. Ada is -gnatwa -gnatwe -gnata. Warnings fail the build.
set -eu
cd "$(dirname "$0")"

run_ada() {
  mode=$1
  rm -rf "obj/$mode"
  mkdir -p "obj/$mode"
  if ! gprbuild -P tests/smoke.gpr -XMODE="$mode" -p; then
    gprconfig --config=Ada --batch -o "obj/ada.cgpr"
    gprbuild --config="obj/ada.cgpr" -P tests/smoke.gpr -XMODE="$mode" -p
  fi
  if ldd "obj/$mode/smoke" | grep -q libgnat; then
    echo "libgnat is dynamically linked (obj/$mode/smoke)" >&2
    exit 1
  fi
  "obj/$mode/smoke"
}

if ! command -v gprbuild >/dev/null 2>&1 && ! command -v gnatmake >/dev/null 2>&1; then
  echo "gnatmake was not found. Install GNAT 12.3 or later." >&2
  exit 1
fi
run_ada n12

node tests/graphemes.mjs
echo "tests ok"
