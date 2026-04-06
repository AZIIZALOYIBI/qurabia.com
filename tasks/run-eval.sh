#!/usr/bin/env bash
# =============================================================================
# run-eval.sh — تشغيل تقييم الوكلاء على مهام QURABIA
# Run agent-eval comparisons on QURABIA tasks
#
# الاستخدام / Usage:
#   ./tasks/run-eval.sh                        # كل المهام، كل الوكلاء (3 تكرارات)
#   ./tasks/run-eval.sh --task task-01         # مهمة واحدة فقط
#   ./tasks/run-eval.sh --agent claude-code    # وكيل واحد فقط
#
# المتطلبات / Prerequisites:
#   pip install agent-eval          # or: pip install git+https://github.com/joaquinhuigomez/agent-eval
#   Set ANTHROPIC_API_KEY, OPENAI_API_KEY etc. for the agents you want to test
# =============================================================================

set -euo pipefail

TASKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$TASKS_DIR/.." && pwd)"
RUNS=3
REPORT_DIR="/tmp/agent-eval-results"
mkdir -p "$REPORT_DIR"

# الوكلاء المراد تقييمهم / Agents to evaluate
AGENTS=(
  "claude-code"
  "aider"
  "codex"
)

# تصفية الوسائط / Parse arguments
TASK_FILTER=""
AGENT_FILTER=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --task)    TASK_FILTER="$2"; shift 2 ;;
    --agent)   AGENT_FILTER="$2"; shift 2 ;;
    --runs)    RUNS="$2";         shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# التحقق من تثبيت agent-eval / Check agent-eval is installed
if ! command -v agent-eval &>/dev/null; then
  echo "❌  agent-eval not found."
  echo "    Install it with:"
  echo "    pip install git+https://github.com/joaquinhuigomez/agent-eval"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  QURABIA Agent Evaluation  |  تقييم وكلاء قُرابيا"
echo "═══════════════════════════════════════════════════════"
echo "  Repository : $REPO_ROOT"
echo "  Tasks dir  : $TASKS_DIR"
echo "  Runs each  : $RUNS"
echo "  Report dir : $REPORT_DIR"
echo "═══════════════════════════════════════════════════════"

# تجميع قائمة المهام / Collect task files
mapfile -t TASK_FILES < <(ls "$TASKS_DIR"/task-*.yaml 2>/dev/null | sort)

if [[ ${#TASK_FILES[@]} -eq 0 ]]; then
  echo "❌  No task YAML files found in $TASKS_DIR"
  exit 1
fi

# تصفية بالاسم إن طُلب / Filter by name if requested
if [[ -n "$TASK_FILTER" ]]; then
  TASK_FILES=( "${TASK_FILES[@]}" )   # copy
  TASK_FILES=( $(printf '%s\n' "${TASK_FILES[@]}" | grep -i "$TASK_FILTER" || true) )
  if [[ ${#TASK_FILES[@]} -eq 0 ]]; then
    echo "❌  No tasks matched filter: $TASK_FILTER"
    exit 1
  fi
fi

# تحديد الوكلاء / Determine agents list
if [[ -n "$AGENT_FILTER" ]]; then
  AGENTS=("$AGENT_FILTER")
fi

echo ""
echo "📋 Tasks to run (${#TASK_FILES[@]}):"
for f in "${TASK_FILES[@]}"; do echo "   • $(basename "$f")"; done
echo ""
echo "🤖 Agents (${#AGENTS[@]}):"
for a in "${AGENTS[@]}"; do echo "   • $a"; done
echo ""

# تشغيل التقييم / Run evaluations
for TASK_FILE in "${TASK_FILES[@]}"; do
  TASK_NAME="$(basename "$TASK_FILE" .yaml)"
  echo "▶  Running task: $TASK_NAME"

  AGENT_ARGS=()
  for a in "${AGENTS[@]}"; do
    AGENT_ARGS+=(--agent "$a")
  done

  agent-eval run \
    --task "$TASK_FILE" \
    "${AGENT_ARGS[@]}" \
    --runs "$RUNS" \
    --output "$REPORT_DIR/$TASK_NAME.json" \
    --repo "$REPO_ROOT" \
    || echo "⚠  Task $TASK_NAME finished with errors (see report)"

  echo ""
done

# توليد التقرير النهائي / Generate final comparison report
echo "═══════════════════════════════════════════════════════"
echo "  Final Report  |  التقرير النهائي"
echo "═══════════════════════════════════════════════════════"

agent-eval report \
  --input "$REPORT_DIR"/*.json \
  --format table \
  || true

echo ""
echo "✅  Full JSON results saved in: $REPORT_DIR"
echo "    Run 'agent-eval report --input $REPORT_DIR/*.json --format html > report.html'"
echo "    to generate an HTML report."
