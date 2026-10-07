#!/usr/bin/env bash
# Run one Vitest spec file N times inside a package and report the failure rate.
# Usage: repeat-test.sh <package-dir> <spec-path-relative-to-package> [runs=10] [--shuffle]
set -u
PKG_DIR="${1:?package dir required, e.g. packages/react}"
SPEC="${2:?spec path required}"
RUNS="${3:-10}"
SHUFFLE=""
if [[ "${3:-}" == "--shuffle" || "${4:-}" == "--shuffle" ]]; then
  SHUFFLE="--sequence.shuffle"
  [[ "${3:-}" == "--shuffle" ]] && RUNS=10
fi

cd "$PKG_DIR" || exit 1
fails=0
for i in $(seq 1 "$RUNS"); do
  if out=$(pnpm exec vitest run "$SPEC" $SHUFFLE 2>&1); then
    printf "run %2d: pass\n" "$i"
  else
    fails=$((fails + 1))
    printf "run %2d: FAIL\n" "$i"
    echo "$out" | grep -E "×|FAIL|Error|expected|received|Timed out" | head -15 | sed 's/^/    /'
  fi
done
echo "----"
echo "failures: $fails / $RUNS ($SPEC)"
[[ "$fails" -eq 0 ]]
