#!/usr/bin/env bash
# ======================================================
# QURABIA — سكريبت المراقبة والبناء التلقائي
# الاستخدام:
#   bash scripts/watch-build.sh --dev      تشغيل خوادم التطوير
#   bash scripts/watch-build.sh --watch    مراقبة وإعادة البناء
#   bash scripts/watch-build.sh --build    بناء مرة واحدة
# ======================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:---build}"

# ── الألوان ────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[QURABIA]${RESET} $*"; }
ok()   { echo -e "${GREEN}[✓]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }
err()  { echo -e "${RED}[✗]${RESET} $*" >&2; }

# ── دالة البناء ────────────────────────────────────────
build_frontend() {
    log "جارٍ بناء الواجهة الأمامية..."
    (cd "$REPO_ROOT/frontend" && npm run build) && ok "البناء اكتمل ✓" || { err "فشل البناء"; return 1; }
}

# ── دالة تشغيل الاختبارات ─────────────────────────────
run_tests() {
    log "جارٍ تشغيل الاختبارات..."
    local failed=0

    log "اختبارات الواجهة الأمامية..."
    (cd "$REPO_ROOT/frontend" && npm test) && ok "اختبارات Frontend ✓" || { err "اختبارات Frontend فشلت"; failed=1; }

    log "اختبارات الواجهة الخلفية..."
    (cd "$REPO_ROOT/backend" && APP_ENV=development python -m pytest -q) && ok "اختبارات Backend ✓" || { err "اختبارات Backend فشلت"; failed=1; }

    return $failed
}

# ── وضع التطوير: تشغيل كلا الخادمين ─────────────────
start_dev() {
    log "بدء خوادم التطوير..."

    # تشغيل خادم Backend
    (cd "$REPO_ROOT/backend" && uvicorn main:app --reload --port 10000) &
    BACKEND_PID=$!
    ok "Backend يعمل على http://localhost:10000 (PID: $BACKEND_PID)"

    # تشغيل خادم Frontend (Vite HMR)
    (cd "$REPO_ROOT/frontend" && npm run dev) &
    FRONTEND_PID=$!
    ok "Frontend يعمل على http://localhost:5173 (PID: $FRONTEND_PID)"

    warn "اضغط Ctrl+C لإيقاف الخوادم"
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; log 'تم إيقاف الخوادم'" EXIT INT TERM
    wait
}

# ── وضع المراقبة: إعادة البناء عند التغيير ───────────
start_watch() {
    log "بدء مراقبة الملفات للبناء التلقائي..."
    warn "سيتم إعادة البناء عند أي تغيير في src/ أو backend/"

    # بناء أولي
    build_frontend

    # التحقق من وجود inotifywait
    if ! command -v inotifywait &>/dev/null; then
        warn "inotifywait غير موجود — استخدام Vite watch بديلاً"
        log "تشغيل Vite في وضع المراقبة..."
        (cd "$REPO_ROOT/frontend" && npx vite build --watch)
        return
    fi

    # مراقبة التغييرات وإعادة البناء
    while true; do
        inotifywait -r -e modify,create,delete,move \
            "$REPO_ROOT/frontend/src" \
            "$REPO_ROOT/backend" \
            --exclude '(node_modules|__pycache__|\.git|dist)' \
            -q 2>/dev/null

        log "تم اكتشاف تغيير — جارٍ إعادة البناء..."
        build_frontend || warn "فشل البناء — انتظار التغيير التالي..."
    done
}

# ── نقطة الدخول ───────────────────────────────────────
case "$MODE" in
    --dev)
        start_dev
        ;;
    --watch)
        start_watch
        ;;
    --build)
        log "بناء المشروع..."
        run_tests && build_frontend && ok "اكتمل البناء الكامل ✓"
        ;;
    --test)
        run_tests && ok "جميع الاختبارات نجحت ✓"
        ;;
    *)
        echo "الاستخدام: $0 [--dev|--watch|--build|--test]"
        echo "  --dev    تشغيل خوادم التطوير"
        echo "  --watch  مراقبة وإعادة البناء تلقائياً"
        echo "  --build  بناء مرة واحدة (افتراضي)"
        echo "  --test   تشغيل جميع الاختبارات"
        exit 1
        ;;
esac
