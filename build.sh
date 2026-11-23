#!/bin/sh
# Wasm build. Stops if AdaWebPack is missing. Never downloads it (D-016).
set -eu
cd "$(dirname "$0")"
ADAWEBPACK=${ADAWEBPACK:-$HOME/toolchains/adawebpack-24}
if [ ! -x "$ADAWEBPACK/usr/bin/llvm-gcc" ]; then
  echo "AdaWebPack is not at $ADAWEBPACK." >&2
  echo "Set ADAWEBPACK, or run tools/get-toolchain.sh after agreeing to the download." >&2
  echo "This script does not download a toolchain." >&2
  exit 1
fi
export LD_LIBRARY_PATH="$ADAWEBPACK/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
LD=$(command -v wasm-ld || true)
if [ -z "$LD" ]; then
  echo "wasm-ld is not on PATH." >&2
  exit 1
fi
SHA=$(git rev-parse --short=7 HEAD)
DIRTY=""
if [ -n "$(git status --porcelain)" ]; then
  DIRTY="+"
fi
WHEN=$(TZ=Europe/Berlin date +%Y%m%d-%H%M)
STAMP="v0.11 b${WHEN} ${SHA}${DIRTY}"
python3 - "$STAMP" << 'PY'
import pathlib, sys
stamp = sys.argv[1]
path = pathlib.Path("src/bardo-version.adb")
text = path.read_text()
needle = 'Stamp : constant String := "'
start = text.find(needle)
end = text.find('";', start)
if start < 0 or end < 0:
    raise SystemExit("stamp line missing in src/bardo-version.adb")
path.write_text(text[:start] + needle + stamp + text[end:])
print(stamp)
PY
rm -rf obj/wasm
mkdir -p obj/wasm
(
  cd obj/wasm
  for F in ../../src/*.adb; do
    "$ADAWEBPACK/usr/bin/llvm-gcc" -c --target=wasm32 -O2 -gnat2022 -gnatwa -gnatwe -gnatp \
      --RTS="$ADAWEBPACK/usr/lib/rts-native" -I../../src "$F"
  done
  ar x "$ADAWEBPACK/usr/lib/rts-native/adalib/libgnat.a" s-memcop.o s-memmov.o s-memset.o
  "$LD" --no-entry --allow-undefined --strip-all --export-memory \
    --export=bardo_input --export=bardo_output --export=bardo_glyph \
    --export=bardo_sidpa \
    --export=bardo_compute --export=bardo_tick --export=bardo_mantra_glyph \
    --export=bardo_start --export=bardo_milli_of_day --export=bardo_walk \
    --export=bardo_anchor --export=bardo_first --export=bardo_realm \
    --export=bardo_karma_start --export=bardo_karma_lighten \
    --export=bardo_karma_heavy --export=bardo_karma_carry \
    --export=bardo_karma_band --export=bardo_karma_chance \
    --export=bardo_karma_realm --export=bardo_rebirth \
    --export=bardo_dull_realm \
    --export=bardo_dissolve_clamp --export=bardo_dissolve_stage \
    --export=bardo_clear_step \
    --export=bardo_womb_path \
    -z stack-size=1048576 --initial-memory=16777216 \
    -o bardo.wasm *.o
)
python3 tools/embed.py obj/wasm/bardo.wasm "$STAMP"
echo "wasm $(wc -c < obj/wasm/bardo.wasm) bytes"
