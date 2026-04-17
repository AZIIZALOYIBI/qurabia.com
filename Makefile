# ======================================================
# QURABIA — Makefile لبناء الكود الذاتي
# الاستخدام: make <هدف>
# ======================================================

.PHONY: help install build test lint clean dev watch quality security security-scan security-fix security-report chaos chaos-mild chaos-critical chaos-random predict full-cycle resilience-test resilience-test-aggressive

# المتغيرات
FRONTEND_DIR := frontend
BACKEND_DIR  := backend
NODE         := node
NPM          := npm
PYTHON       := python3
PYTEST       := pytest

# الهدف الافتراضي: يعرض المساعدة
help:
	@echo ""
	@echo "  QURABIA — نظام البناء الذاتي"
	@echo "  =================================="
	@echo ""
	@echo "  make install         تثبيت جميع التبعيات (frontend + backend)"
	@echo "  make build           بناء المشروع كاملاً (frontend production)"
	@echo "  make test            تشغيل جميع الاختبارات (frontend + backend)"
	@echo "  make lint            فحص جودة الكود (biome + ruff)"
	@echo "  make quality         فحص شامل: سرية + اختبارات + بناء"
	@echo "  make dev             تشغيل خوادم التطوير (frontend + backend)"
	@echo "  make watch           مراقبة الملفات وإعادة البناء تلقائياً"
	@echo "  make clean           حذف ملفات البناء المؤقتة"
	@echo ""
	@echo "  🛡️  أوامر الأمان:"
	@echo "  make security        فحص الثغرات الأمنية الشامل"
	@echo "  make security-scan   فحص متقدم مع تحليل الاتجاهات"
	@echo "  make security-fix    إصلاح تلقائي للثغرات (ذكي)"
	@echo "  make security-report توليد تقرير أمني مفصل"
	@echo ""
	@echo "  ⚡ أوامر المرونة والفوضى (Resilience & Chaos):"
	@echo "  make chaos           حقن فوضى (latency بسيط)"
	@echo "  make chaos-mild      سيناريو تأخير بسيط"
	@echo "  make chaos-critical  سيناريو تأخير حرج"
	@echo "  make chaos-random    فوضى عشوائية متعددة"
	@echo "  make predict         تنبؤ بتأثير التغييرات"
	@echo "  make resilience-test اختبار المرونة الكامل"
	@echo "  make full-cycle      دورة كاملة: build + security + chaos + test"
	@echo ""

# ───────────────────────────────────────────────
# تثبيت التبعيات
# ───────────────────────────────────────────────
install: install-frontend install-backend

install-frontend:
	@echo "==> تثبيت تبعيات الواجهة الأمامية..."
	cd $(FRONTEND_DIR) && $(NPM) install --no-audit --no-fund

install-backend:
	@echo "==> تثبيت تبعيات الواجهة الخلفية..."
	cd $(BACKEND_DIR) && $(PYTHON) -m pip install -r requirements.txt

# ───────────────────────────────────────────────
# البناء
# ───────────────────────────────────────────────
build: install-frontend
	@echo "==> بناء الواجهة الأمامية..."
	cd $(FRONTEND_DIR) && $(NPM) run build
	@echo "✓ البناء اكتمل: frontend/dist/"

# ───────────────────────────────────────────────
# الاختبارات
# ───────────────────────────────────────────────
test: test-frontend test-backend

test-frontend:
	@echo "==> اختبارات الواجهة الأمامية..."
	cd $(FRONTEND_DIR) && $(NPM) test

test-backend:
	@echo "==> اختبارات الواجهة الخلفية..."
	cd $(BACKEND_DIR) && APP_ENV=development $(PYTEST) -q

test-coverage:
	@echo "==> تغطية الاختبارات..."
	cd $(FRONTEND_DIR) && $(NPM) run test:coverage

# ───────────────────────────────────────────────
# فحص الجودة
# ───────────────────────────────────────────────
lint:
	@echo "==> فحص الكود..."
	@if command -v biome > /dev/null 2>&1; then \
		biome check $(FRONTEND_DIR)/src; \
	else \
		cd $(FRONTEND_DIR) && npx biome check src; \
	fi
	@if command -v ruff > /dev/null 2>&1; then \
		ruff check $(BACKEND_DIR); \
	else \
		$(PYTHON) -m ruff check $(BACKEND_DIR); \
	fi

quality:
	@echo "==> فحص الأسرار..."
	$(PYTHON) scripts/secret_scan.py
	@$(MAKE) test
	@$(MAKE) build
	@echo ""
	@echo "✓ QUALITY GATE: PASS — الكود جاهز للنشر"

# ───────────────────────────────────────────────
# التطوير
# ───────────────────────────────────────────────
dev:
	@echo "==> تشغيل خوادم التطوير..."
	@echo "   الواجهة الأمامية: http://localhost:5173"
	@echo "   الواجهة الخلفية:  http://localhost:10000"
	@bash scripts/watch-build.sh --dev

watch:
	@echo "==> مراقبة الملفات وإعادة البناء تلقائياً..."
	@bash scripts/watch-build.sh --watch

# ───────────────────────────────────────────────
# التنظيف
# ───────────────────────────────────────────────
clean:
	@echo "==> حذف ملفات البناء..."
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(FRONTEND_DIR)/node_modules/.vite
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ تم التنظيف"

clean-all: clean
	@echo "==> حذف node_modules..."
	rm -rf $(FRONTEND_DIR)/node_modules
	@echo "✓ تم تنظيف كل شيء"

# ───────────────────────────────────────────────
# الأمان 🛡️
# ───────────────────────────────────────────────
security: security-scan

security-scan:
	@echo "==> 🛡️ فحص الثغرات الأمنية..."
	@bash scripts/security-guardian.sh

security-fix:
	@echo "==> 🤖 إصلاح تلقائي للثغرات..."
	@$(PYTHON) scripts/auto-healer.py

security-report:
	@echo "==> 📊 توليد التقرير الأمني..."
	@bash scripts/security-guardian.sh
	@echo ""
	@echo "✓ التقرير متاح في: security-reports/"

# ───────────────────────────────────────────────
# المرونة والفوضى ⚡
# ───────────────────────────────────────────────
chaos: chaos-mild

chaos-mild:
	@echo "==> ⚡ حقن فوضى (تأخير بسيط)..."
	@cd $(BACKEND_DIR) && $(PYTHON) -m services.chaos_engine.chaos_injector --scenario mild_latency --duration 20

chaos-critical:
	@echo "==> ⚡⚡ حقن فوضى حرجة..."
	@cd $(BACKEND_DIR) && $(PYTHON) -m services.chaos_engine.chaos_injector --scenario critical_latency --duration 15

chaos-random:
	@echo "==> 🎲 فوضى عشوائية..."
	@cd $(BACKEND_DIR) && $(PYTHON) -m services.chaos_engine.chaos_injector --scenario random --duration 60

predict:
	@echo "==> 🔮 تنبؤ بالتأثير..."
	@echo "   [Digital Twin] تحليل السيناريو المحتمل..."
	@echo "   ℹ️  ملاحظة: يتطلب تشغيل Digital Twin Worker"
	@echo "   استخدم: docker compose up digital_twin"

resilience-test:
	@echo "==> 🚀 اختبار المرونة الكامل..."
	@$(PYTHON) scripts/full-resilience-test.py --suite standard

resilience-test-aggressive:
	@echo "==> 🔥 اختبار مرونة قاسي..."
	@$(PYTHON) scripts/full-resilience-test.py --suite aggressive

full-cycle: build security chaos-mild test
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "🚀 دورة العمل الكاملة اكتملت بنجاح!"
	@echo "   ✅ Build: مكتمل"
	@echo "   ✅ Security: آمن"
	@echo "   ✅ Chaos: مُختبَر"
	@echo "   ✅ Tests: ناجح"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "💪 المشروع آمن، محصّن، ومُختبَر في الفوضى!"
	@echo ""

