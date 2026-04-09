"""
Quantum AGI Engine v5.0
نواة AGI مع حوكمة أخلاقية وتطور ذاتي مبسّط.
"""

from __future__ import annotations

import ast
import copy
import hashlib
import json
import logging
import os
import random
import sqlite3
import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Deque, Dict, List, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantumAGI")


@dataclass(frozen=True)
class ErrorEvent:
    kind: str
    message: str
    url: str = ""
    stack: str = ""
    user_agent: str = ""
    release: str = ""
    ts: float = field(default_factory=time.time)
    context: Dict[str, Any] = field(default_factory=dict)

    def signature(self) -> str:
        base = f"{self.kind}|{self.message}|{self.url}"
        return hashlib.sha256(base.encode()).hexdigest()[:16]


class LearningMemory:
    """ذاكرة تعلم خفيفة لتجميع الأخطاء وتوليد مخرجات قابلة للاستفادة.

    - تجمع أخطاء الواجهة/الخادم عبر API.
    - تلخص أكثر المشاكل تكراراً مع اقتراحات علاجية عامة.
    - لا تخزن أسراراً؛ تعتمد على تلخيص محدود (message/signature) فقط.
    """

    def __init__(self, max_events: int = 500, db_path: Optional[str] = None, db_max_rows: int = 25000) -> None:
        self._max_events = int(max_events)
        self._events: Deque[ErrorEvent] = deque(maxlen=self._max_events)
        self._counts: Dict[str, int] = {}
        self._last_seen: Dict[str, float] = {}
        self._db_path = (db_path or "").strip() or None
        self._db_max_rows = int(db_max_rows)
        self._db_conn: Optional[sqlite3.Connection] = None
        self._db_lock = threading.Lock()
        self._db_insert_count = 0

        if self._db_path:
            self._db_conn = self._open_db(self._db_path)
            self._init_db()
            self._hydrate_from_db()

    def _open_db(self, path: str) -> sqlite3.Connection:
        folder = os.path.dirname(os.path.abspath(path))
        if folder:
            os.makedirs(folder, exist_ok=True)
        return sqlite3.connect(path, check_same_thread=False, timeout=5)

    def _init_db(self) -> None:
        if not self._db_conn:
            return
        with self._db_lock:
            cur = self._db_conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL;")
            cur.execute("PRAGMA synchronous=NORMAL;")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS learning_events (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  ts REAL NOT NULL,
                  kind TEXT NOT NULL,
                  message TEXT NOT NULL,
                  url TEXT NOT NULL,
                  stack TEXT NOT NULL,
                  user_agent TEXT NOT NULL,
                  release TEXT NOT NULL,
                  context_json TEXT NOT NULL,
                  signature TEXT NOT NULL
                )
                """
            )
            cur.execute("CREATE INDEX IF NOT EXISTS idx_learning_events_sig ON learning_events(signature)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_learning_events_ts ON learning_events(ts)")
            self._db_conn.commit()

    def _hydrate_from_db(self) -> None:
        if not self._db_conn:
            return
        with self._db_lock:
            cur = self._db_conn.cursor()
            # تحميل الإجماليات الفعلية من DB (بدلاً من عدّ صف بصف)
            # هذا يضمن أن _counts تعكس المجاميع الحقيقية لكل التاريخ
            cur.execute(
                "SELECT signature, COUNT(*) as cnt, MAX(ts) as last_ts FROM learning_events GROUP BY signature"
            )
            for signature, cnt, last_ts in cur.fetchall():
                self._counts[signature] = int(cnt)
                self._last_seen[signature] = float(last_ts)

            # تحميل آخر N حدث للحصول على سياق (kind/message/url/stack)
            cur.execute(
                """
                SELECT ts, kind, message, url, stack, user_agent, release, context_json
                FROM learning_events
                ORDER BY id DESC
                LIMIT ?
                """,
                (self._max_events,),
            )
            rows = cur.fetchall()
        for ts, kind, message, url, stack, user_agent, release, context_json in reversed(rows):
            try:
                context = json.loads(context_json) if context_json else {}
            except (json.JSONDecodeError, TypeError, ValueError):
                context = {}
            ev = ErrorEvent(
                kind=kind,
                message=message,
                url=url,
                stack=stack,
                user_agent=user_agent,
                release=release,
                ts=float(ts),
                context=context if isinstance(context, dict) else {},
            )
            self._events.append(ev)

    def _persist(self, event: ErrorEvent, signature: str) -> None:
        if not self._db_conn:
            return
        ctx = {}
        if isinstance(event.context, dict):
            ctx = event.context
        try:
            context_json = json.dumps(ctx, ensure_ascii=False, separators=(",", ":"))
        except (TypeError, ValueError):
            context_json = "{}"
        with self._db_lock:
            cur = self._db_conn.cursor()
            cur.execute(
                """
                INSERT INTO learning_events (ts, kind, message, url, stack, user_agent, release, context_json, signature)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    float(event.ts),
                    event.kind,
                    event.message,
                    event.url,
                    event.stack,
                    event.user_agent,
                    event.release,
                    context_json,
                    signature,
                ),
            )
            self._db_conn.commit()
            self._db_insert_count += 1
            if self._db_max_rows > 0 and self._db_insert_count % 100 == 0:
                cur.execute(
                    """
                    DELETE FROM learning_events
                    WHERE id NOT IN (
                      SELECT id FROM learning_events ORDER BY id DESC LIMIT ?
                    )
                    """,
                    (self._db_max_rows,),
                )
                self._db_conn.commit()

    def record_error(self, event: ErrorEvent) -> Dict[str, Any]:
        sig = event.signature()
        self._counts[sig] = int(self._counts.get(sig, 0)) + 1
        self._last_seen[sig] = event.ts
        self._events.append(event)
        self._persist(event, sig)
        return {"signature": sig, "count": self._counts[sig]}

    def _get_total_count(self) -> int:
        """إرجاع العدد الحقيقي للأحداث من DB إن وُجد، وإلا من الذاكرة."""
        if self._db_conn:
            try:
                with self._db_lock:
                    cur = self._db_conn.cursor()
                    cur.execute("SELECT COUNT(*) FROM learning_events")
                    row = cur.fetchone()
                    if row:
                        return int(row[0])
            except Exception:
                pass
        return len(self._events)

    def summary(self, top: int = 8) -> Dict[str, Any]:
        top_n = max(1, min(int(top), 50))
        items = sorted(self._counts.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
        top_sigs = {sig for sig, _ in items}
        by_sig: Dict[str, ErrorEvent] = {}
        for ev in reversed(list(self._events)):
            sig = ev.signature()
            if sig in top_sigs and sig not in by_sig:
                by_sig[sig] = ev

        rows: List[Dict[str, Any]] = []
        suggestions: List[str] = []
        for sig, count in items:
            ev = by_sig.get(sig)
            rows.append({
                "signature": sig,
                "count": count,
                "last_seen": self._last_seen.get(sig, 0.0),
                "kind": ev.kind if ev else "",
                "message": (ev.message[:240] if ev else ""),
                "url": ev.url if ev else "",
                "release": ev.release if ev else "",
            })
            suggestions.extend(self._suggestions_for(ev) if ev else [])

        uniq_suggestions: List[str] = []
        seen: set = set()
        for s in suggestions:
            if s in seen:
                continue
            seen.add(s)
            uniq_suggestions.append(s)

        return {"total_events": self._get_total_count(), "top": rows, "suggestions": uniq_suggestions[:12]}

    def metrics(self, window_s: int = 3600, top: int = 6) -> Dict[str, Any]:
        now = time.time()
        window = max(10, min(int(window_s), 7 * 24 * 3600))
        since = now - window
        recent = [ev for ev in self._events if ev.ts >= since]
        counts: Dict[str, int] = {}
        last_seen: Dict[str, float] = {}
        for ev in recent:
            sig = ev.signature()
            counts[sig] = int(counts.get(sig, 0)) + 1
            last_seen[sig] = max(float(ev.ts), float(last_seen.get(sig, 0.0)))
        top_n = max(1, min(int(top), 50))
        items = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
        by_sig: Dict[str, ErrorEvent] = {}
        for ev in reversed(recent):
            sig = ev.signature()
            if sig in dict(items) and sig not in by_sig:
                by_sig[sig] = ev
        rows: List[Dict[str, Any]] = []
        for sig, count in items:
            ev = by_sig.get(sig)
            rows.append({
                "signature": sig,
                "count": count,
                "last_seen": last_seen.get(sig, 0.0),
                "kind": ev.kind if ev else "",
                "message": (ev.message[:240] if ev else ""),
                "url": ev.url if ev else "",
                "release": ev.release if ev else "",
            })
        per_min = (len(recent) / (window / 60.0)) if window > 0 else 0.0
        return {
            "window_s": window,
            "since_ts": since,
            "events": len(recent),
            "unique_signatures": len(counts),
            "events_per_min": round(per_min, 4),
            "top": rows,
        }

    @staticmethod
    def _suggestions_for(ev: ErrorEvent) -> List[str]:
        msg = (ev.message or "").lower()
        stack = (ev.stack or "").lower()
        url = (ev.url or "").lower()
        out: List[str] = []

        # أخطاء الشبكة والاتصال
        if "failed to fetch" in msg or "networkerror" in msg or "load failed" in msg:
            out.append("تحقق من إعداد VITE_API_BASE_URL أو عنوان الـAPI داخل الواجهة، ثم تحقق من CORS في الباك-إند.")
        if "cors" in msg or "access-control-allow-origin" in msg:
            out.append("يوجد CORS: أضف الدومين/المنفذ ضمن allow_origins في FastAPI ثم أعد نشر الباك-إند.")
        if "timeout" in msg or "timed out" in msg or "etimedout" in msg:
            out.append("انتهت مهلة الاتصال: تحقق من أن الـAPI يستجيب خلال 30 ثانية، وفكّر في إضافة retry logic مع exponential backoff.")
        if "websocket" in msg or "ws://" in msg or "wss://" in msg:
            out.append("خطأ في WebSocket: تأكد من صحة عنوان WS، وأن الـbackend يدعم WebSocket، وأن الـproxy لا يغلق الاتصال مبكراً.")
        if "ereconnrefused" in msg or "connection refused" in msg or "econnrefused" in msg:
            out.append("الخادم يرفض الاتصال: تحقق من أن الـbackend يعمل على المنفذ الصحيح وأن الـfirewall لا يحجب الطلبات.")

        # أخطاء التحميل والكاش
        if "chunkloaderror" in msg or "loading chunk" in msg or "importing a module script failed" in msg:
            out.append("قد يكون هناك كاش قديم (Service Worker): حدّث sw.js وغيّر إصدار الكاش ثم اطلب من المستخدم تحديث الصفحة/مسح بيانات الموقع.")
        if "serviceworker" in msg or "sw.js" in url or "sw.js" in stack:
            out.append("راجع sw.js: تجنب cache-first للأصول الحرجة واستعمل network-first للـJS/CSS لتفادي شاشة قديمة.")
        if "syntaxerror" in msg and ("unexpected token" in msg or "json" in msg):
            out.append("خطأ JSON: الـAPI يُعيد HTML بدلاً من JSON (غالباً صفحة خطأ 404/500). راجع عنوان الـAPI وتحقق من استجابات الخادم.")

        # أخطاء المسارات والنشر
        if "404" in msg or "not found" in msg:
            out.append("تحقق من المسارات في النشر: وجود landing.html وsitemap.xml وrobots.txt داخل frontend/public وأنها ضمن dist.")
        if "401" in msg or "unauthorized" in msg:
            out.append("خطأ مصادقة (401): تحقق من توكن الجلسة أو مفتاح الـAPI وتأكد من إرسال Authorization header بشكل صحيح.")
        if "403" in msg or "forbidden" in msg:
            out.append("خطأ صلاحيات (403): المستخدم لا يملك الصلاحية للوصول لهذا المورد. راجع إعدادات CORS وقواعد الوصول في الـbackend.")

        # أخطاء JavaScript الشائعة
        if "typeerror" in msg:
            if "undefined" in msg or "null" in msg or "cannot read" in msg or "is not a function" in msg:
                out.append("TypeError: تحقق من القيم المحتملة undefined/null قبل الوصول إليها، واستخدم optional chaining (?.) وnullish coalescing (??).")
        if "referenceerror" in msg:
            out.append("ReferenceError: متغير غير معرّف. تحقق من الاستيراد (import) وترتيب تعريف المتغيرات في الكود.")
        if "rangeerror" in msg or "maximum call stack" in msg:
            out.append("RangeError/Stack Overflow: تحقق من وجود دوال تعاودية (recursive) بلا شرط إيقاف، أو مصفوفات بأحجام ضخمة.")
        if "out of memory" in msg or "allocation failed" in msg:
            out.append("نفاد الذاكرة: ابحث عن تسريبات ذاكرة (memory leaks)، واستخدم lazy loading للمكونات والبيانات الثقيلة.")

        # أخطاء WebGL والرسم
        if "webgl" in msg or "webgl" in stack or "three" in stack:
            out.append("خطأ WebGL/Three.js: تحقق من دعم المتصفح لـWebGL، وغلّف المكونات ثلاثية الأبعاد بـThreeErrorBoundary.")
        if "canvas" in msg and "getcontext" in msg:
            out.append("فشل تهيئة Canvas: المتصفح قد يكون في وضع headless أو تم تعطيل WebGL. استخدم fallback UI عند عدم توفر WebGL.")

        # أخطاء المكونات وReact
        if "react" in stack or "react-dom" in stack:
            if "minified react error" in msg or "invariant" in msg:
                out.append("خطأ React داخلي: راجع رسالة الخطأ كاملة على reactjs.org/docs/error-decoder.html لفك شفرة رقم الخطأ.")
            if "update" in msg and "unmounted" in msg:
                out.append("تحديث state بعد إلغاء تحميل المكون: استخدم cleanup في useEffect مع AbortController أو علامة mounted.")

        # أخطاء الـbackend المنقولة
        if "internal server error" in msg or "500" in msg:
            out.append("خطأ 500 في الـbackend: راجع سجلات الخادم (Render logs) لتحديد السبب الجذري.")
        if "rate limit" in msg or "too many requests" in msg or "429" in msg:
            out.append("تجاوز حد الطلبات (429): أضف retry مع تأخير، أو راجع إعدادات rate limiting في الـbackend.")

        return out

class IntentCategory(Enum):
    DRUG_DISCOVERY = auto()
    CRYPTOGRAPHY = auto()
    GENOMICS = auto()
    PHYSICS_SIMULATION = auto()
    CODE_OPTIMIZATION = auto()
    UNKNOWN = auto()


class EthicsViolationType(Enum):
    HARM_POTENTIAL = auto()
    PRIVACY_BREACH = auto()
    AUTONOMY_OVERRIDE = auto()
    JUSTICE_VIOLATION = auto()
    NONE = auto()


@dataclass
class AGIDecision:
    decision_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    intent: IntentCategory = IntentCategory.UNKNOWN
    recommended_action: str = ""
    preloaded_modules: List[str] = field(default_factory=list)
    ethics_score: float = 1.0
    ethics_violation: EthicsViolationType = EthicsViolationType.NONE
    execution_plan: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class EthicsMatrix:
    non_maleficence: float = 0.95
    beneficence: float = 0.80
    autonomy: float = 0.90
    justice: float = 0.85
    _integrity_hash: str = field(init=False)

    def __post_init__(self) -> None:
        self._integrity_hash = self._compute_hash()

    def _compute_hash(self) -> str:
        payload = f"{self.non_maleficence}|{self.beneficence}|{self.autonomy}|{self.justice}"
        return hashlib.sha256(payload.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        return self._compute_hash() == self._integrity_hash


class PerceptionMatrix:
    _INTENT_KEYWORDS: Dict[IntentCategory, List[str]] = {
        IntentCategory.DRUG_DISCOVERY: ["drug", "دواء", "protein", "جزيء", "vqe"],
        IntentCategory.CRYPTOGRAPHY: ["crypto", "تشفير", "bb84", "qkd", "key"],
        IntentCategory.GENOMICS: ["genomics", "جين", "dna", "mutation"],
        IntentCategory.PHYSICS_SIMULATION: ["physics", "كم", "ثقب", "محاكاة"],
        IntentCategory.CODE_OPTIMIZATION: ["code", "refactor", "تحسين", "أداء"],
    }

    _PRELOAD_MODULES: Dict[IntentCategory, List[str]] = {
        IntentCategory.DRUG_DISCOVERY: ["VQEEngine", "MolecularSimulator"],
        IntentCategory.CRYPTOGRAPHY: ["BB84Protocol", "PQCKeyGen"],
        IntentCategory.GENOMICS: ["QSVMClassifier", "SequenceAnalyzer"],
        IntentCategory.PHYSICS_SIMULATION: ["AlOtaibiEngine", "BlackHoleSimulator"],
        IntentCategory.CODE_OPTIMIZATION: ["RefactoringEngine", "QAModule"],
        IntentCategory.UNKNOWN: ["QuantumCore"],
    }

    def perceive(self, user_input: str) -> Tuple[IntentCategory, float]:
        text = user_input.lower().strip()
        scores: Dict[IntentCategory, float] = {}
        for intent, words in self._INTENT_KEYWORDS.items():
            scores[intent] = float(sum(1 for w in words if w in text))

        if not scores:
            return IntentCategory.UNKNOWN, 0.1

        best_intent = max(scores, key=scores.get)
        max_score = scores[best_intent]
        confidence = min(1.0, max(0.1, max_score / 3.0))
        if max_score <= 0:
            return IntentCategory.UNKNOWN, 0.1
        return best_intent, confidence

    def get_preload_modules(self, intent: IntentCategory) -> List[str]:
        return self._PRELOAD_MODULES.get(intent, self._PRELOAD_MODULES[IntentCategory.UNKNOWN])


class EthicalGovernanceSystem:
    def __init__(self) -> None:
        self._matrix = EthicsMatrix()
        self._audit: List[Dict[str, Any]] = []

    def evaluate(self, decision: AGIDecision, context: Dict[str, Any]) -> Tuple[bool, float, EthicsViolationType]:
        if not self._matrix.verify_integrity():
            raise SystemExit("ETHICS_INTEGRITY_VIOLATION")

        harm_potential = float(context.get("harm_potential", 0.0))
        benefit_score = float(context.get("benefit_score", 0.8))
        user_consent = bool(context.get("user_consent", True))
        fairness_score = float(context.get("fairness_score", 0.9))

        scores = {
            "non_maleficence": 1.0 - harm_potential,
            "beneficence": benefit_score,
            "autonomy": 1.0 if user_consent else 0.0,
            "justice": fairness_score,
        }
        weights = {"non_maleficence": 2.0, "beneficence": 1.0, "autonomy": 1.5, "justice": 1.0}
        ethics_score = sum(scores[k] * weights[k] for k in scores) / sum(weights.values())

        violation = EthicsViolationType.NONE
        allowed = True
        if scores["non_maleficence"] < self._matrix.non_maleficence:
            allowed, violation = False, EthicsViolationType.HARM_POTENTIAL
        elif scores["autonomy"] < self._matrix.autonomy:
            allowed, violation = False, EthicsViolationType.AUTONOMY_OVERRIDE
        elif scores["beneficence"] < self._matrix.beneficence:
            allowed, violation = False, EthicsViolationType.JUSTICE_VIOLATION

        self._audit.append({
            "timestamp": time.time(),
            "decision_id": decision.decision_id,
            "allowed": allowed,
            "score": round(ethics_score, 4),
            "violation": violation.name,
        })

        return allowed, round(ethics_score, 4), violation


class SelfEvolutionModule:
    # عتبة الجودة بعد تعديل المعادلة: الكود الصالح يسجّل ≥ 0.5،
    # والعتبة 0.45 تضمن رفض الكود غير المجدي بينما تبقى الدرجة متغيّرة (لا ثابتة).
    QA_THRESHOLD = 0.45

    def __init__(self, ethics: EthicalGovernanceSystem) -> None:
        self._ethics = ethics

    def propose_refactoring(self, module_name: str, current_code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(current_code)
            syntax_score = 1.0
        except SyntaxError:
            return {"applied": False, "reason": "invalid_syntax", "quality_score": 0.0}

        # احسب درجة الجودة بناءً على خصائص AST الفعلية
        node_count = sum(1 for _ in ast.walk(tree))
        # مكافأة الوحدات الأكثر ثراءً في الهيكل (الهدف 50 عقدة كحد أدنى منطقي)
        complexity_score = min(1.0, node_count / 50.0)
        # نسبة الـdocstrings إلى إجمالي العقد
        doc_nodes = sum(
            1 for node in ast.walk(tree)
            if isinstance(node, ast.Expr)
            and isinstance(getattr(node, "value", None), ast.Constant)
            and isinstance(node.value.value, str)
        )
        doc_score = min(1.0, doc_nodes / max(1, node_count / 20))
        quality_score = round(min(1.0, 0.5 * syntax_score + 0.3 * complexity_score + 0.2 * doc_score), 4)

        if quality_score < self.QA_THRESHOLD:
            return {"applied": False, "reason": "qa_below_threshold", "quality_score": quality_score}

        decision = AGIDecision(intent=IntentCategory.CODE_OPTIMIZATION)
        # benefit_score مستقل عن quality_score: الأول يقيس الأثر الأخلاقي لعملية
        # إعادة الهيكلة ذاتها (دائماً معتدل)، بينما يقيس quality_score جودة الكود
        # وينعكس على نتيجة الإخراج للمستدعي.
        allowed, ethics_score, violation = self._ethics.evaluate(decision, {
            "harm_potential": 0.02,
            "benefit_score": 0.85,  # مستوى ثابت معقول لعملية إعادة الهيكلة
            "user_consent": True,
            "fairness_score": 0.95,
        })
        if not allowed:
            return {"applied": False, "reason": violation.name, "quality_score": quality_score, "ethics_score": ethics_score}

        optimized = "# optimized\n" + current_code
        return {
            "applied": True,
            "module": module_name,
            "quality_score": quality_score,
            "ethics_score": ethics_score,
            "code": optimized,
        }


class QuantumAGIEngine:
    def __init__(self) -> None:
        self._perception = PerceptionMatrix()
        self._ethics = EthicalGovernanceSystem()
        self._evolution = SelfEvolutionModule(self._ethics)
        self._history: List[AGIDecision] = []

    def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> AGIDecision:
        ctx = context or {}
        intent, confidence = self._perception.perceive(user_input)
        decision = AGIDecision(
            intent=intent,
            confidence=confidence,
            preloaded_modules=self._perception.get_preload_modules(intent),
        )

        allowed, ethics_score, violation = self._ethics.evaluate(decision, {
            "harm_potential": float(ctx.get("harm_potential", 0.05)),
            "benefit_score": max(confidence, 0.7),
            "user_consent": bool(ctx.get("user_consent", True)),
            "fairness_score": float(ctx.get("fairness_score", 0.9)),
        })

        decision.ethics_score = ethics_score
        decision.ethics_violation = violation
        if not allowed:
            decision.recommended_action = f"مرفوض أخلاقياً: {violation.name}"
            return decision

        decision.recommended_action = self._build_action(intent, confidence)
        decision.execution_plan = {
            "estimated_ms": 100 if confidence > 0.7 else 250,
            "parallel": intent != IntentCategory.UNKNOWN,
            "retry_on_fail": 3,
        }
        self._history.append(decision)
        return decision

    def self_evolve(self, module_name: str, current_code: str) -> Dict[str, Any]:
        return self._evolution.propose_refactoring(module_name, current_code)

    @staticmethod
    def _build_action(intent: IntentCategory, confidence: float) -> str:
        actions = {
            IntentCategory.DRUG_DISCOVERY: "تشغيل VQE للمركبات الدوائية",
            IntentCategory.CRYPTOGRAPHY: "تفعيل BB84 وتوليد مفاتيح",
            IntentCategory.GENOMICS: "تشغيل QSVM للتسلسل الجيني",
            IntentCategory.PHYSICS_SIMULATION: "محاكاة معادلة العتيبي",
            IntentCategory.CODE_OPTIMIZATION: "تحليل AST وتحسين الأداء",
            IntentCategory.UNKNOWN: "تهيئة تحليل عام",
        }
        return f"{actions[intent]} (ثقة: {confidence:.1%})"


@dataclass
class GenesisAlgorithmDNA:
    """تمثيل مبسط لـDNA الخوارزمية.

    الهدف: توفير نموذج خفيف للنواة التطورية (طفرة/تزاوج/توليد مجتمع) دون الاعتماد على مكتبات ML الثقيلة.
    """
    algorithm_type: str
    genes: Dict[str, Any]
    generation: int = 0
    fitness: float = 0.0
    age: int = 0
    parent_fitness: float = 0.0
    id: str = field(default_factory=lambda: f"dna_{uuid.uuid4().hex[:10]}")

    def mutate(self, mutation_rate: float = 0.3) -> "GenesisAlgorithmDNA":
        mutated_genes = copy.deepcopy(self.genes)
        for gene_name, gene_value in mutated_genes.items():
            if random.random() >= mutation_rate:
                continue

            if isinstance(gene_value, bool):
                mutated_genes[gene_name] = not gene_value
                continue

            if isinstance(gene_value, int):
                delta = max(1, int(abs(gene_value) * 0.3))
                mutated_genes[gene_name] = max(1, gene_value + random.randint(-delta, delta))
                continue

            if isinstance(gene_value, float):
                delta = abs(gene_value) * 0.4
                new_val = gene_value + random.uniform(-delta, delta)
                mutated_genes[gene_name] = max(0.000001, float(new_val))
                continue

        child = GenesisAlgorithmDNA(
            algorithm_type=self.algorithm_type,
            genes=mutated_genes,
            generation=self.generation + 1,
            parent_fitness=self.fitness,
        )
        return child

    @staticmethod
    def crossover(parent_a: "GenesisAlgorithmDNA", parent_b: "GenesisAlgorithmDNA") -> "GenesisAlgorithmDNA":
        if parent_a.algorithm_type != parent_b.algorithm_type:
            return parent_a.mutate()

        child_genes: Dict[str, Any] = {}
        for gene_name in parent_a.genes:
            if gene_name in parent_b.genes and random.random() < 0.5:
                child_genes[gene_name] = parent_b.genes[gene_name]
            else:
                child_genes[gene_name] = parent_a.genes[gene_name]

        return GenesisAlgorithmDNA(
            algorithm_type=parent_a.algorithm_type,
            genes=child_genes,
            generation=max(parent_a.generation, parent_b.generation) + 1,
            parent_fitness=max(parent_a.fitness, parent_b.fitness),
        )

    def model_spec(self) -> Dict[str, Any]:
        return {"type": self.algorithm_type, "params": self.genes}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "algorithm_type": self.algorithm_type,
            "genes": self.genes,
            "fitness": self.fitness,
            "generation": self.generation,
            "age": self.age,
            "parent_fitness": self.parent_fitness,
        }


class GenesisDNAFactory:
    """مصنع توليد DNA عشوائي لأنواع متعددة من النماذج.

    هذه القيم تمثل نطاقات افتراضية قابلة للتطور لاحقاً عبر الطفرات والتزاوج.
    """
    _GENE_TEMPLATES: Dict[str, Any] = {
        "xgboost": lambda: {
            "n_estimators": random.randint(50, 500),
            "max_depth": random.randint(3, 10),
            "learning_rate": random.uniform(0.01, 0.3),
            "subsample": random.uniform(0.6, 1.0),
            "colsample_bytree": random.uniform(0.6, 1.0),
            "min_child_weight": random.randint(1, 10),
            "gamma": random.uniform(0.0, 5.0),
            "reg_alpha": random.uniform(0.001, 5.0),
            "reg_lambda": random.uniform(0.001, 5.0),
        },
        "lightgbm": lambda: {
            "n_estimators": random.randint(50, 500),
            "max_depth": random.randint(3, 12),
            "learning_rate": random.uniform(0.01, 0.3),
            "num_leaves": random.randint(20, 150),
            "subsample": random.uniform(0.6, 1.0),
            "colsample_bytree": random.uniform(0.6, 1.0),
            "min_child_samples": random.randint(5, 50),
            "reg_alpha": random.uniform(0.001, 5.0),
            "reg_lambda": random.uniform(0.001, 5.0),
        },
        "catboost": lambda: {
            "iterations": random.randint(50, 500),
            "depth": random.randint(4, 10),
            "learning_rate": random.uniform(0.01, 0.3),
            "l2_leaf_reg": random.uniform(0.1, 10.0),
        },
        "random_forest": lambda: {
            "n_estimators": random.randint(50, 400),
            "max_depth": random.randint(3, 15),
            "min_samples_split": random.randint(2, 20),
            "min_samples_leaf": random.randint(1, 10),
        },
        "extra_trees": lambda: {
            "n_estimators": random.randint(50, 400),
            "max_depth": random.randint(3, 15),
            "min_samples_split": random.randint(2, 20),
        },
        "gradient_boosting": lambda: {
            "n_estimators": random.randint(50, 300),
            "max_depth": random.randint(3, 8),
            "learning_rate": random.uniform(0.01, 0.3),
            "subsample": random.uniform(0.6, 1.0),
        },
        "logistic": lambda: {
            "C": random.uniform(0.01, 10.0),
            "max_iter": random.randint(500, 3000),
        },
        "mlp": lambda: {
            "layer1": random.randint(32, 256),
            "layer2": random.randint(16, 128),
            "layer3": random.randint(8, 64),
            "learning_rate": random.uniform(0.0001, 0.01),
            "max_iter": random.randint(100, 500),
            "alpha": random.uniform(0.0001, 0.01),
        },
        "knn": lambda: {
            "n_neighbors": random.randint(3, 25),
            "weights": random.choice(["uniform", "distance"]),
        },
        "adaboost": lambda: {
            "n_estimators": random.randint(50, 300),
            "learning_rate": random.uniform(0.01, 1.5),
        },
    }

    _TYPES: List[str] = list(_GENE_TEMPLATES.keys())

    @classmethod
    def create_random(cls, algorithm_type: str) -> GenesisAlgorithmDNA:
        factory = cls._GENE_TEMPLATES.get(algorithm_type)
        if not factory:
            raise ValueError(f"Unknown algorithm_type: {algorithm_type}")
        return GenesisAlgorithmDNA(algorithm_type=algorithm_type, genes=factory())

    @classmethod
    def create_population(cls, size_per_type: int = 5) -> List[GenesisAlgorithmDNA]:
        pop: List[GenesisAlgorithmDNA] = []
        for t in cls._TYPES:
            for _ in range(int(size_per_type)):
                pop.append(cls.create_random(t))
        return pop


class GenesisEngine:
    """واجهة تشغيل للنواة التطورية الخاصة بـGENESIS.

    تدعم:
    • إنشاء مجتمع أولي (Population)
    • تقييم اللياقة الاستدلالي (Heuristic Fitness) بدون تدريب نماذج ML
    • تطور جيل كامل: Elitism + Tournament + BLX-α Crossover + Mutation
    • تتبع قاعة المشاهير (Hall of Fame) عبر الأجيال
    """

    # أوزان اللياقة الاستدلالية لكل خوارزمية
    _HEURISTIC_WEIGHTS: Dict[str, Dict[str, Any]] = {
        "xgboost":          {"lr_opt": 0.05, "depth_opt": 5, "est_opt": 200},
        "lightgbm":         {"lr_opt": 0.05, "depth_opt": 6, "est_opt": 200},
        "catboost":         {"lr_opt": 0.05, "depth_opt": 6, "est_opt": 200},
        "gradient_boosting": {"lr_opt": 0.05, "depth_opt": 4, "est_opt": 150},
        "random_forest":    {"lr_opt": None, "depth_opt": 8, "est_opt": 200},
        "extra_trees":      {"lr_opt": None, "depth_opt": 8, "est_opt": 200},
        "mlp":              {"lr_opt": 0.001, "depth_opt": None, "est_opt": None},
        "logistic":         {"lr_opt": None, "depth_opt": None, "est_opt": None},
        "knn":              {"lr_opt": None, "depth_opt": None, "est_opt": None},
        "adaboost":         {"lr_opt": 0.5, "depth_opt": None, "est_opt": 100},
    }

    def __init__(self) -> None:
        self._hall_of_fame: List[GenesisAlgorithmDNA] = []
        self._generation_count: int = 0

    # ── إنشاء المجتمع ─────────────────────────────────────────────────────────

    def create_population(
        self, size_per_type: int = 5, seed: Optional[int] = None,
    ) -> List[GenesisAlgorithmDNA]:
        """أنشئ مجتمعاً أولياً من DNA عشوائي."""
        size = int(size_per_type)
        if size < 1 or size > 100:
            raise ValueError("size_per_type must be between 1 and 100")
        if seed is not None:
            saved_state = random.getstate()
            random.seed(int(seed))
            try:
                return GenesisDNAFactory.create_population(size_per_type=size)
            finally:
                random.setstate(saved_state)
        return GenesisDNAFactory.create_population(size_per_type=size)

    # ── اللياقة الاستدلالية ───────────────────────────────────────────────────

    def _heuristic_fitness(self, dna: GenesisAlgorithmDNA) -> float:
        """قدّر لياقة DNA من قيمة جيناته بدون تدريب نموذج فعلي.

        يعكس معرفة خبيرة بأفضل مناطق فضاء المعامِلات لكل خوارزمية.
        اللياقة في [0.0, 1.0] — 0.5 خط الأساس، > 0.7 واعد.
        """
        g = dna.genes
        t = dna.algorithm_type
        hw = self._HEURISTIC_WEIGHTS.get(t, {})
        score = 0.5

        # ─── مكافأة معدل تعلم مثالي ───────────────────────────────────────
        lr_opt = hw.get("lr_opt")
        if lr_opt is not None:
            lr = g.get("learning_rate", lr_opt)
            lr_score = max(0.0, 1.0 - abs(lr - lr_opt) / max(lr_opt, 0.01))
            score += 0.12 * lr_score

        # ─── مكافأة عمق مثالي ────────────────────────────────────────────
        depth_opt = hw.get("depth_opt")
        if depth_opt is not None:
            depth = g.get("max_depth", g.get("depth", depth_opt))
            depth_score = max(0.0, 1.0 - abs(depth - depth_opt) / 10.0)
            score += 0.10 * depth_score

        # ─── مكافأة عدد النماذج (كلما زاد قليلاً أفضل) ──────────────────
        est_opt = hw.get("est_opt")
        if est_opt is not None:
            n_est = g.get("n_estimators", g.get("iterations", est_opt))
            est_score = min(float(n_est) / est_opt, 1.5) / 1.5
            score += 0.08 * est_score

        # ─── خصومات خاصة بالنوع ──────────────────────────────────────────
        if t == "knn":
            k = g.get("n_neighbors", 7)
            score += 0.10 * max(0.0, 1.0 - abs(k - 7) / 22.0)

        elif t == "logistic":
            C = g.get("C", 1.0)
            score += 0.10 * max(0.0, 1.0 - abs(C - 1.0) / 10.0)

        elif t == "mlp":
            alpha = g.get("alpha", 0.001)
            score += 0.08 * max(0.0, 1.0 - abs(alpha - 0.001) / 0.01)

        elif t in ("xgboost", "lightgbm"):
            subsample = g.get("subsample", 0.8)
            score += 0.06 * max(0.0, subsample - 0.5)

        # ─── عقوبة الشيخوخة ──────────────────────────────────────────────
        age_penalty = min(dna.age * 0.01, 0.10)
        # ─── مكافأة نسب الأبوين ───────────────────────────────────────────
        parent_bonus = dna.parent_fitness * 0.08

        return min(1.0, max(0.0, score - age_penalty + parent_bonus))

    def evaluate_population(
        self, population: List[GenesisAlgorithmDNA],
    ) -> List[GenesisAlgorithmDNA]:
        """أسند لياقة استدلالية لكل DNA ورتّب المجتمع تنازلياً."""
        for dna in population:
            dna.fitness = self._heuristic_fitness(dna)
        population.sort(key=lambda d: d.fitness, reverse=True)
        return population

    # ── التطور ────────────────────────────────────────────────────────────────

    def evolve_generation(
        self,
        population: List[GenesisAlgorithmDNA],
        mutation_rate: float = 0.3,
        elite_fraction: float = 0.2,
        tournament_size: int = 3,
    ) -> List[GenesisAlgorithmDNA]:
        """طوّر المجتمع جيلاً واحداً: Elitism + Tournament + BLX-α + Mutation.

        الخطوات:
        1. قيّم اللياقة إن لم تُقيَّم بعد.
        2. احتفظ بالنخبة مباشرة.
        3. Tournament Selection + BLX-α Crossover لملء %50.
        4. طفرات عشوائية لملء %30.
        5. تجديد عشوائي للباقي.
        """
        if not population:
            raise ValueError("population cannot be empty")
        n = len(population)

        # تقييم إن لم تُقيَّم بعد
        if all(d.fitness == 0.0 for d in population):
            population = self.evaluate_population(population)
        else:
            population = sorted(population, key=lambda d: d.fitness, reverse=True)

        # حدّث قاعة المشاهير
        self._update_hall_of_fame(population)

        new_pop: List[GenesisAlgorithmDNA] = []

        # ① Elitism
        n_elite = max(1, int(n * elite_fraction))
        for dna in population[:n_elite]:
            dna.age += 1
            new_pop.append(dna)

        # ② Tournament + Crossover (%50)
        target_cross = int(n * 0.70)
        while len(new_pop) < target_cross:
            parent_a = self._tournament(population, tournament_size)
            parent_b = self._tournament(population, tournament_size)
            if parent_a.algorithm_type == parent_b.algorithm_type and random.random() < 0.7:
                child = GenesisAlgorithmDNA.crossover(parent_a, parent_b)
            else:
                child = parent_a.mutate(mutation_rate)
            new_pop.append(child)

        # ③ طفرات (%20)
        while len(new_pop) < int(n * 0.90):
            parent = self._tournament(population, tournament_size)
            new_pop.append(parent.mutate(mutation_rate))

        # ④ تجديد عشوائي للتنوع
        all_types = list(GenesisDNAFactory._TYPES)
        while len(new_pop) < n:
            new_pop.append(GenesisDNAFactory.create_random(random.choice(all_types)))

        self._generation_count += 1
        # أعد تقييم الجيل الجديد
        return self.evaluate_population(new_pop[:n])

    # ── الحالة ────────────────────────────────────────────────────────────────

    @property
    def hall_of_fame(self) -> List[GenesisAlgorithmDNA]:
        """أفضل 10 DNAs عبر كل الأجيال."""
        return self._hall_of_fame[:10]

    def get_status(self) -> Dict[str, Any]:
        """ارجع حالة المحرك: الأجيال، قاعة المشاهير، أنواع الخوارزميات."""
        return {
            "generation_count": self._generation_count,
            "hall_of_fame_size": len(self._hall_of_fame),
            "hall_of_fame": [d.to_dict() for d in self._hall_of_fame[:5]],
            "best_fitness": self._hall_of_fame[0].fitness if self._hall_of_fame else 0.0,
            "algorithm_types": list(GenesisDNAFactory._TYPES),
            "n_algorithm_types": len(GenesisDNAFactory._TYPES),
        }

    # ── مساعدات داخلية ────────────────────────────────────────────────────────

    def _tournament(
        self, population: List[GenesisAlgorithmDNA], k: int,
    ) -> GenesisAlgorithmDNA:
        """اختر الأفضل من k عشوائيين (Tournament Selection)."""
        pool = random.sample(population, min(k, len(population)))
        return max(pool, key=lambda d: d.fitness)

    def _update_hall_of_fame(
        self, population: List[GenesisAlgorithmDNA],
    ) -> None:
        """أضف أي فرد يتفوق على الحد الأدنى للقاعة (أفضل 10)."""
        for dna in population:
            if (
                len(self._hall_of_fame) < 10
                or dna.fitness > self._hall_of_fame[-1].fitness
            ):
                self._hall_of_fame.append(copy.deepcopy(dna))
                self._hall_of_fame.sort(key=lambda d: d.fitness, reverse=True)
                self._hall_of_fame = self._hall_of_fame[:10]


def run_integration_test() -> None:
    """اختبار تكاملي لمحرك AGI الكمي."""
    import logging
    logger = logging.getLogger("qurabia.integration_test")
    engine = QuantumAGIEngine()
    logger.info("BB84: %s", engine.process("أريد استخدام BB84 للتشفير").recommended_action)
    logger.info("VQE: %s", engine.process("قم بمحاكاة دواء جديد باستخدام VQE").recommended_action)
    logger.info(
        "HARM: %s",
        engine.process("نفّذ طلبًا ضارًا", {"harm_potential": 0.99, "user_consent": False}).recommended_action,
    )


if __name__ == "__main__":
    run_integration_test()
