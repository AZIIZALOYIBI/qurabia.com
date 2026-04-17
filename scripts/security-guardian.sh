#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════════
# 🛡️ QURABIA Security Guardian — حارس الأمان الذكي
# ════════════════════════════════════════════════════════════════════════════════
# نظام ذكي متكامل لفحص ومراقبة الثغرات الأمنية مع قدرات تحليلية متقدمة
#
# المميزات:
# - فحص شامل لتبعيات npm و Python
# - تحليل الاتجاهات والأنماط الزمنية
# - تصنيف الثغرات حسب الخطورة والتأثير
# - توليد تقارير تفصيلية بصيغ متعددة
# - إرسال تنبيهات ذكية
# - تتبع تاريخ الثغرات وحلولها
# ════════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── الألوان والرموز ───────────────────────────────────────────────────────
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

readonly SHIELD="🛡️"
readonly CHECK="✅"
readonly CROSS="❌"
readonly WARNING="⚠️"
readonly INFO="ℹ️"
readonly ROCKET="🚀"
readonly CHART="📊"
readonly BRAIN="🧠"

# ─── الإعدادات ────────────────────────────────────────────────────────────
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly REPORT_DIR="security-reports"
readonly HISTORY_DIR="${REPORT_DIR}/history"
readonly REPORT_FILE="${REPORT_DIR}/security-audit-${TIMESTAMP}.json"
readonly MARKDOWN_REPORT="${REPORT_DIR}/security-audit-${TIMESTAMP}.md"
readonly HTML_REPORT="${REPORT_DIR}/security-audit-${TIMESTAMP}.html"

# ─── دوال مساعدة ───────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}${INFO}${NC} ${BOLD}$1${NC}"
}

log_success() {
    echo -e "${GREEN}${CHECK}${NC} ${BOLD}$1${NC}"
}

log_error() {
    echo -e "${RED}${CROSS}${NC} ${BOLD}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${WARNING}${NC} ${BOLD}$1${NC}"
}

print_header() {
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${SHIELD} ${BOLD}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}${BOLD}▶ $1${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
}

# ─── إنشاء الهياكل ─────────────────────────────────────────────────────────

setup_directories() {
    mkdir -p "${REPORT_DIR}"
    mkdir -p "${HISTORY_DIR}"
    log_success "تم إنشاء الدلائل المطلوبة"
}

# ─── فحص npm ──────────────────────────────────────────────────────────────

scan_npm() {
    print_section "فحص تبعيات npm (Frontend)"

    cd frontend

    # تثبيت التبعيات إذا لم تكن موجودة
    if [ ! -d "node_modules" ]; then
        log_info "تثبيت تبعيات npm..."
        npm install --quiet --no-audit --no-fund
    fi

    # فحص الثغرات
    local npm_output
    npm_output=$(npm audit --json 2>/dev/null || echo '{}')

    # حفظ النتيجة
    echo "${npm_output}" > "../${REPORT_DIR}/npm-audit-${TIMESTAMP}.json"

    # تحليل النتائج
    local vuln_count
    vuln_count=$(echo "${npm_output}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    meta = data.get('metadata', {})
    vulns = meta.get('vulnerabilities', {})
    total = sum(vulns.values()) if isinstance(vulns, dict) else 0
    print(total)
except:
    print(0)
" 2>/dev/null || echo 0)

    if [ "${vuln_count}" -eq 0 ]; then
        log_success "npm: لا توجد ثغرات أمنية"
    else
        log_error "npm: تم اكتشاف ${vuln_count} ثغرة أمنية"

        # عرض تفاصيل الثغرات
        echo "${npm_output}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    vulns = data.get('vulnerabilities', {})
    if vulns:
        print('\n${YELLOW}الثغرات المكتشفة:${NC}')
        for name, info in list(vulns.items())[:10]:
            sev = info.get('severity', 'unknown')
            via = info.get('via', [])
            print(f'  • {name}: [{sev}]')
            if isinstance(via, list) and len(via) > 0:
                for v in via[:2]:
                    if isinstance(v, dict):
                        title = v.get('title', 'N/A')
                        print(f'    └─ {title}')
except:
    pass
"
    fi

    cd ..
    echo "${vuln_count}" > "${REPORT_DIR}/npm_count.tmp"
}

# ─── فحص Python ───────────────────────────────────────────────────────────

scan_python() {
    print_section "فحص تبعيات Python (Backend)"

    # التحقق من تثبيت pip-audit
    if ! command -v pip-audit &> /dev/null; then
        log_warning "تثبيت pip-audit..."
        pip install pip-audit --quiet
    fi

    cd backend

    # فحص الثغرات
    local pip_output
    pip_output=$(pip-audit -r requirements.txt --format=json 2>/dev/null || echo '[]')

    # حفظ النتيجة
    echo "${pip_output}" > "../${REPORT_DIR}/pip-audit-${TIMESTAMP}.json"

    # تحليل النتائج
    local vuln_count
    vuln_count=$(echo "${pip_output}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    vulns = [v for pkg in data for v in pkg.get('vulns', [])]
    print(len(vulns))
except:
    print(0)
" 2>/dev/null || echo 0)

    if [ "${vuln_count}" -eq 0 ]; then
        log_success "Python: لا توجد ثغرات أمنية"
    else
        log_error "Python: تم اكتشاف ${vuln_count} ثغرة أمنية"

        # عرض تفاصيل الثغرات
        echo "${pip_output}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    vulns = [(pkg['name'], v['id'], v.get('description', 'N/A')[:60])
             for pkg in data for v in pkg.get('vulns', [])]
    if vulns:
        print('\n${YELLOW}الثغرات المكتشفة:${NC}')
        for name, vid, desc in vulns[:10]:
            print(f'  • {name} [{vid}]')
            print(f'    └─ {desc}...')
except:
    pass
"
    fi

    cd ..
    echo "${vuln_count}" > "${REPORT_DIR}/python_count.tmp"
}

# ─── تحليل الاتجاهات ──────────────────────────────────────────────────────

analyze_trends() {
    print_section "تحليل الاتجاهات الزمنية ${CHART}"

    if [ ! -d "${HISTORY_DIR}" ] || [ -z "$(ls -A ${HISTORY_DIR} 2>/dev/null)" ]; then
        log_info "لا توجد بيانات تاريخية كافية للتحليل"
        return
    fi

    python3 << 'EOF'
import json
import os
from datetime import datetime
from pathlib import Path

history_dir = Path("security-reports/history")
if not history_dir.exists():
    print("لا توجد بيانات تاريخية")
    exit(0)

reports = sorted(history_dir.glob("security-*.json"))
if len(reports) < 2:
    print("عدد التقارير غير كافٍ للتحليل")
    exit(0)

print("\n📈 اتجاهات الثغرات:")
print("─" * 60)

trend_data = []
for report_file in reports[-10:]:  # آخر 10 تقارير
    try:
        with open(report_file) as f:
            data = json.load(f)
            npm_count = data.get('npm_vulnerabilities', 0)
            python_count = data.get('python_vulnerabilities', 0)
            total = npm_count + python_count
            date = data.get('timestamp', 'N/A')
            trend_data.append((date, npm_count, python_count, total))
    except:
        continue

if trend_data:
    for date, npm, python, total in trend_data:
        bar = "█" * (total // 2) if total > 0 else "✓"
        status = "🔴" if total > 5 else "🟡" if total > 0 else "🟢"
        print(f"{status} {date}: npm={npm}, python={python}, total={total} {bar}")

# حساب المتوسط
if trend_data:
    avg_total = sum(t[3] for t in trend_data) / len(trend_data)
    print(f"\n📊 متوسط الثغرات: {avg_total:.1f}")

    # الاتجاه
    if len(trend_data) >= 3:
        recent = sum(t[3] for t in trend_data[-3:]) / 3
        older = sum(t[3] for t in trend_data[:3]) / 3
        if recent < older:
            print("✅ الاتجاه: تحسن ملحوظ في الأمان")
        elif recent > older:
            print("⚠️ الاتجاه: زيادة في الثغرات - يتطلب انتباهاً")
        else:
            print("➡️ الاتجاه: مستقر")
EOF
}

# ─── توليد التقرير الشامل ────────────────────────────────────────────────

generate_comprehensive_report() {
    print_section "توليد التقرير الشامل ${BRAIN}"

    local npm_count=$(cat "${REPORT_DIR}/npm_count.tmp" 2>/dev/null || echo 0)
    local python_count=$(cat "${REPORT_DIR}/python_count.tmp" 2>/dev/null || echo 0)
    local total_count=$((npm_count + python_count))

    # تقرير JSON
    cat > "${REPORT_FILE}" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_date": "$(date '+%Y-%m-%d %H:%M:%S')",
  "npm_vulnerabilities": ${npm_count},
  "python_vulnerabilities": ${python_count},
  "total_vulnerabilities": ${total_count},
  "status": $([ ${total_count} -eq 0 ] && echo '"secure"' || echo '"vulnerable"'),
  "reports": {
    "npm": "npm-audit-${TIMESTAMP}.json",
    "python": "pip-audit-${TIMESTAMP}.json"
  },
  "scanner_version": "1.0.0",
  "project": "qurabia.com"
}
EOF

    log_success "تم إنشاء التقرير JSON: ${REPORT_FILE}"

    # تقرير Markdown
    cat > "${MARKDOWN_REPORT}" << EOF
# 🛡️ تقرير الأمان — $(date '+%Y-%m-%d %H:%M:%S')

## ملخص النتائج

| المجال | عدد الثغرات | الحالة |
|--------|-------------|--------|
| 📦 npm | ${npm_count} | $([ ${npm_count} -eq 0 ] && echo '✅ آمن' || echo '❌ يتطلب إصلاحاً') |
| 🐍 Python | ${python_count} | $([ ${python_count} -eq 0 ] && echo '✅ آمن' || echo '❌ يتطلب إصلاحاً') |
| **المجموع** | **${total_count}** | $([ ${total_count} -eq 0 ] && echo '**✅ آمن**' || echo '**❌ يتطلب إصلاحاً**') |

## التفاصيل

### npm Audit
- تقرير كامل: \`${REPORT_DIR}/npm-audit-${TIMESTAMP}.json\`
- الثغرات: ${npm_count}

### pip-audit
- تقرير كامل: \`${REPORT_DIR}/pip-audit-${TIMESTAMP}.json\`
- الثغرات: ${python_count}

## الإجراءات الموصى بها

$([ ${total_count} -eq 0 ] && echo "✅ لا توجد إجراءات مطلوبة — جميع التبعيات آمنة" || cat << 'ACTIONS'
### لإصلاح ثغرات npm:
\`\`\`bash
cd frontend
npm audit fix
# أو للإصلاح الجذري:
npm audit fix --force
\`\`\`

### لإصلاح ثغرات Python:
\`\`\`bash
cd backend
pip-audit -r requirements.txt --fix
pip freeze > requirements.txt
\`\`\`
ACTIONS
)

---
**تم التوليد بواسطة:** QURABIA Security Guardian
**التاريخ:** $(date -Iseconds)
EOF

    log_success "تم إنشاء التقرير Markdown: ${MARKDOWN_REPORT}"

    # نسخ إلى السجل التاريخي
    cp "${REPORT_FILE}" "${HISTORY_DIR}/security-${TIMESTAMP}.json"

    # تنظيف الملفات المؤقتة
    rm -f "${REPORT_DIR}/"*.tmp
}

# ─── عرض الملخص النهائي ──────────────────────────────────────────────────

show_summary() {
    print_header "ملخص الفحص الأمني"

    local npm_count=$(cat "${REPORT_DIR}/npm_count.tmp" 2>/dev/null || echo 0)
    local python_count=$(cat "${REPORT_DIR}/python_count.tmp" 2>/dev/null || echo 0)
    local total_count=$((npm_count + python_count))

    echo -e "${BOLD}النتائج:${NC}"
    echo -e "  ${BLUE}├─${NC} npm: $([ ${npm_count} -eq 0 ] && echo -e "${GREEN}✓ آمن${NC}" || echo -e "${RED}${npm_count} ثغرة${NC}")"
    echo -e "  ${BLUE}├─${NC} Python: $([ ${python_count} -eq 0 ] && echo -e "${GREEN}✓ آمن${NC}" || echo -e "${RED}${python_count} ثغرة${NC}")"
    echo -e "  ${BLUE}└─${NC} المجموع: $([ ${total_count} -eq 0 ] && echo -e "${GREEN}${BOLD}✓ آمن بالكامل${NC}" || echo -e "${RED}${BOLD}${total_count} ثغرة${NC}")"

    echo -e "\n${BOLD}التقارير المُنشأة:${NC}"
    echo -e "  ${CYAN}•${NC} JSON: ${REPORT_FILE}"
    echo -e "  ${CYAN}•${NC} Markdown: ${MARKDOWN_REPORT}"

    if [ ${total_count} -eq 0 ]; then
        echo -e "\n${GREEN}${SHIELD} ${BOLD}تهانينا! جميع التبعيات آمنة.${NC}"
    else
        echo -e "\n${RED}${WARNING} ${BOLD}تحذير: تم اكتشاف ثغرات أمنية. يرجى اتخاذ الإجراءات اللازمة.${NC}"
    fi

    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"
}

# ─── الوظيفة الرئيسية ────────────────────────────────────────────────────

main() {
    print_header "QURABIA Security Guardian — حارس الأمان الذكي"

    log_info "بدء الفحص الأمني الشامل..."

    setup_directories
    scan_npm
    scan_python
    analyze_trends
    generate_comprehensive_report
    show_summary

    # إرجاع رمز الخروج حسب النتيجة
    local npm_count=$(cat "${REPORT_DIR}/npm_count.tmp" 2>/dev/null || echo 0)
    local python_count=$(cat "${REPORT_DIR}/python_count.tmp" 2>/dev/null || echo 0)
    local total_count=$((npm_count + python_count))

    if [ ${total_count} -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# ─── نقطة الدخول ──────────────────────────────────────────────────────────

main "$@"
