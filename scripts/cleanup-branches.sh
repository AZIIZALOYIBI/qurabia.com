#!/usr/bin/env bash
# سكريبت تنظيف الفروع المدمجة في main
# يحذف جميع الفروع البعيدة التي تم دمجها في main
# الفروع المحمية: main, gh-pages
#
# الاستخدام:
#   ./scripts/cleanup-branches.sh          # معاينة فقط (لا يحذف شيئاً)
#   ./scripts/cleanup-branches.sh --delete # حذف الفروع فعلياً

set -euo pipefail

REPO="AZIIZALOYIBI/qurabia.com"
PROTECTED_BRANCHES="main|gh-pages"
DRY_RUN=true

if [[ "${1:-}" == "--delete" ]]; then
  DRY_RUN=false
fi

echo "🔍 جاري فحص الفروع المدمجة في main..."
echo ""

# الحصول على الفروع المدمجة
MERGED_BRANCHES=$(git branch -r --merged origin/main | \
  grep -v HEAD | \
  sed 's/origin\///' | \
  sed 's/^[[:space:]]*//' | \
  grep -Ev "^($PROTECTED_BRANCHES)$" | \
  sort)

COUNT=$(echo "$MERGED_BRANCHES" | grep -c . || true)

if [[ "$COUNT" -eq 0 ]]; then
  echo "✅ لا توجد فروع مدمجة للحذف"
  exit 0
fi

echo "📋 عدد الفروع المدمجة القابلة للحذف: $COUNT"
echo "──────────────────────────────────────────"
echo "$MERGED_BRANCHES"
echo "──────────────────────────────────────────"
echo ""

if $DRY_RUN; then
  echo "ℹ️  هذه معاينة فقط. لحذف الفروع فعلياً، شغّل:"
  echo "   ./scripts/cleanup-branches.sh --delete"
  echo ""
  echo "أو يمكنك حذفها يدوياً من GitHub:"
  echo "   https://github.com/$REPO/branches/stale"
  exit 0
fi

echo "⚠️  سيتم حذف $COUNT فرع. هل تريد المتابعة؟ (y/N)"
read -r CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "❌ تم الإلغاء"
  exit 0
fi

DELETED=0
FAILED=0

for BRANCH in $MERGED_BRANCHES; do
  echo -n "🗑️  حذف $BRANCH ... "
  if git push origin --delete "$BRANCH" 2>/dev/null; then
    echo "✅"
    ((DELETED++))
  else
    echo "❌ فشل"
    ((FAILED++))
  fi
done

echo ""
echo "──────────────────────────────────────────"
echo "✅ تم حذف: $DELETED فرع"
if [[ "$FAILED" -gt 0 ]]; then
  echo "❌ فشل حذف: $FAILED فرع"
fi
echo "──────────────────────────────────────────"
