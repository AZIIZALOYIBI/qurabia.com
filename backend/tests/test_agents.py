"""
اختبارات وحدة لـ agents_service.py
=====================================
تغطي: BaseAgent, CreativityAgent, DevelopmentAgent,
       ResearchAgent, QualityAgent, AgentOrchestrator

تشغيل:
    cd backend && python -m pytest tests/test_agents.py -v
"""

from __future__ import annotations

import os
import sys
import time

import pytest

# إضافة مسار backend إلى sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents_service import (
    AgentOrchestrator,
    AgentRequest,
    AgentResponse,
    AgentStatus,
    CreativityAgent,
    DevelopmentAgent,
    OrchestratorRequest,
    OrchestratorResponse,
    QualityAgent,
    ResearchAgent,
)

# ═══════════════════════════════════════════════════════════════════════════════
# الثوابت المشتركة
# ═══════════════════════════════════════════════════════════════════════════════

SAMPLE_PROMPT = "بناء نظام توصيات ذكي بالعربية لمنصة التجارة الإلكترونية"
SAMPLE_REQUEST = AgentRequest(prompt=SAMPLE_PROMPT)


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات AgentRequest — التحقق من المدخلات
# ═══════════════════════════════════════════════════════════════════════════════


class TestAgentRequest:
    """اختبارات نموذج طلب الوكيل مع Pydantic validation."""

    def test_valid_request(self) -> None:
        """طلب صالح يجب أن يُنشأ بدون خطأ."""
        req = AgentRequest(prompt="مرحبا بالعالم")
        assert req.prompt == "مرحبا بالعالم"
        assert req.language == "ar"
        assert req.context is None

    def test_prompt_too_short_raises(self) -> None:
        """طلب قصير جداً (أقل من 3 أحرف) يجب أن يُثير خطأ."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            AgentRequest(prompt="أ")

    def test_prompt_too_long_raises(self) -> None:
        """طلب طويل جداً (أكثر من 2000 حرف) يجب أن يُثير خطأ."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            AgentRequest(prompt="ع" * 2001)

    def test_invalid_language_raises(self) -> None:
        """لغة غير مدعومة يجب أن تُثير خطأ."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            AgentRequest(prompt="نص تجريبي", language="fr")

    def test_english_language_accepted(self) -> None:
        """اللغة الإنجليزية مقبولة."""
        req = AgentRequest(prompt="test prompt", language="en")
        assert req.language == "en"

    def test_with_context(self) -> None:
        """الطلب مع سياق إضافي يجب أن يُخزَّن بشكل صحيح."""
        ctx = {"domain": "ecommerce", "size": 1000}
        req = AgentRequest(prompt="تحليل البيانات", context=ctx)
        assert req.context == ctx


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات CreativityAgent
# ═══════════════════════════════════════════════════════════════════════════════


class TestCreativityAgent:
    """اختبارات وكيل الإبداع."""

    def setup_method(self) -> None:
        self.agent = CreativityAgent()

    def test_agent_type(self) -> None:
        assert self.agent.AGENT_TYPE == "creativity"

    def test_think_returns_string(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        assert isinstance(thought, str)
        assert len(thought) > 10

    def test_think_mentions_prompt(self) -> None:
        """التفكير يجب أن يحتوي على جزء من الطلب."""
        thought = self.agent.think("نظام ذكاء")
        assert "نظام ذكاء" in thought or "نظام" in thought

    def test_generate_ideas_returns_list(self) -> None:
        ideas = self.agent.generate_ideas(SAMPLE_PROMPT)
        assert isinstance(ideas, list)
        assert len(ideas) == 5

    def test_generate_ideas_custom_count(self) -> None:
        ideas = self.agent.generate_ideas(SAMPLE_PROMPT, count=3)
        assert len(ideas) == 3

    def test_brainstorm_returns_dict_with_categories(self) -> None:
        result = self.agent.brainstorm(SAMPLE_PROMPT)
        assert isinstance(result, dict)
        assert "تقنية" in result
        assert "تصميمية" in result
        assert "استراتيجية" in result

    def test_innovate_returns_list_of_initiatives(self) -> None:
        ideas = ["فكرة ١", "فكرة ٢", "فكرة ٣"]
        initiatives = self.agent.innovate(ideas)
        assert isinstance(initiatives, list)
        assert len(initiatives) == 3
        for init in initiatives:
            assert "فكرة" in init
            assert "أولوية" in init
            assert "الزمن_المقدر" in init

    def test_act_returns_required_keys(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        result = self.agent.act(thought, SAMPLE_PROMPT)
        assert "ideas" in result
        assert "brainstorm_categories" in result
        assert "initiatives" in result
        assert "creativity_score" in result
        assert "diversity_index" in result

    def test_creativity_score_in_range(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        result = self.agent.act(thought, SAMPLE_PROMPT)
        score = result["creativity_score"]
        assert 0.0 <= score <= 1.0

    def test_reflect_returns_string(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        result = self.agent.act(thought, SAMPLE_PROMPT)
        reflection = self.agent.reflect(result, SAMPLE_PROMPT)
        assert isinstance(reflection, str)
        assert len(reflection) > 10

    def test_run_returns_agent_response(self) -> None:
        response = self.agent.run(SAMPLE_REQUEST)
        assert isinstance(response, AgentResponse)
        assert response.status == AgentStatus.DONE
        assert response.agent_type == "creativity"
        assert response.duration_ms >= 0

    def test_run_result_has_ideas(self) -> None:
        response = self.agent.run(SAMPLE_REQUEST)
        assert "ideas" in response.result
        assert isinstance(response.result["ideas"], list)


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات DevelopmentAgent
# ═══════════════════════════════════════════════════════════════════════════════


class TestDevelopmentAgent:
    """اختبارات وكيل التطوير."""

    def setup_method(self) -> None:
        self.agent = DevelopmentAgent()

    def test_agent_type(self) -> None:
        assert self.agent.AGENT_TYPE == "development"

    def test_suggest_improvements_returns_list(self) -> None:
        improvements = self.agent.suggest_improvements(SAMPLE_PROMPT)
        assert isinstance(improvements, list)
        assert len(improvements) == 5

    def test_each_improvement_has_priority(self) -> None:
        improvements = self.agent.suggest_improvements(SAMPLE_PROMPT)
        for imp in improvements:
            assert "الأولوية" in imp
            assert imp["الأولوية"] in ["حرجة", "عالية", "متوسطة", "منخفضة"]

    def test_code_review_has_required_sections(self) -> None:
        review = self.agent.code_review(SAMPLE_PROMPT)
        assert "جودة_الكود" in review
        assert "نقاط_القوة" in review
        assert "نقاط_الضعف" in review
        assert "الاقتراحات_الفورية" in review

    def test_code_quality_score_in_range(self) -> None:
        review = self.agent.code_review(SAMPLE_PROMPT)
        score = review["جودة_الكود"]
        assert 0.0 <= score <= 1.0

    def test_architecture_review_has_migration_map(self) -> None:
        arch = self.agent.architecture_review(SAMPLE_PROMPT)
        assert "خارطة_الهجرة" in arch
        assert len(arch["خارطة_الهجرة"]) >= 3

    def test_act_returns_tech_debt_score(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        result = self.agent.act(thought, SAMPLE_PROMPT)
        assert "tech_debt_score" in result
        assert 0.0 <= result["tech_debt_score"] <= 1.0

    def test_run_success(self) -> None:
        response = self.agent.run(SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE
        assert "improvements" in response.result


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات ResearchAgent
# ═══════════════════════════════════════════════════════════════════════════════


class TestResearchAgent:
    """اختبارات وكيل البحث."""

    def setup_method(self) -> None:
        self.agent = ResearchAgent()

    def test_agent_type(self) -> None:
        assert self.agent.AGENT_TYPE == "research"

    def test_analyze_returns_keywords(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        assert "الكلمات_المفتاحية" in analysis
        assert isinstance(analysis["الكلمات_المفتاحية"], list)

    def test_analyze_has_dimensions(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        assert "الأبعاد_المحللة" in analysis
        assert len(analysis["الأبعاد_المحللة"]) >= 3

    def test_analyze_has_sources(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        assert "مصادر_مقترحة" in analysis
        assert len(analysis["مصادر_مقترحة"]) > 0

    def test_synthesize_returns_main_finding(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        synthesis = self.agent.synthesize(analysis)
        assert "النتيجة_الرئيسية" in synthesis
        assert "مستوى_الثقة" in synthesis

    def test_confidence_in_range(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        synthesis = self.agent.synthesize(analysis)
        confidence = synthesis["مستوى_الثقة"]
        assert 0.0 <= confidence <= 1.0

    def test_recommend_returns_sorted_list(self) -> None:
        analysis = self.agent.analyze(SAMPLE_PROMPT)
        synthesis = self.agent.synthesize(analysis)
        recommendations = self.agent.recommend(synthesis)
        assert isinstance(recommendations, list)
        assert len(recommendations) >= 2
        for rec in recommendations:
            assert "توصية" in rec
            assert "الأثر" in rec

    def test_run_success(self) -> None:
        response = self.agent.run(SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE
        assert "recommendations" in response.result


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات QualityAgent
# ═══════════════════════════════════════════════════════════════════════════════


class TestQualityAgent:
    """اختبارات وكيل الجودة."""

    def setup_method(self) -> None:
        self.agent = QualityAgent()

    def test_agent_type(self) -> None:
        assert self.agent.AGENT_TYPE == "quality"

    def test_audit_has_security_score(self) -> None:
        result = self.agent.audit(SAMPLE_PROMPT)
        assert "security_score" in result
        assert 0.0 <= result["security_score"] <= 1.0

    def test_audit_has_security_checks(self) -> None:
        result = self.agent.audit(SAMPLE_PROMPT)
        assert "فحوصات_الأمان" in result
        checks = result["فحوصات_الأمان"]
        assert "ناجح" in checks
        assert "تحذيرات" in checks
        assert "فاشل" in checks

    def test_no_failed_security_checks(self) -> None:
        """لا يجب أن تكون هناك فحوصات أمانية فاشلة في الحالة الطبيعية."""
        result = self.agent.audit(SAMPLE_PROMPT)
        assert result["فحوصات_الأمان"]["فاشل"] == []

    def test_benchmark_has_response_time(self) -> None:
        result = self.agent.benchmark(SAMPLE_PROMPT)
        assert "زمن_الاستجابة_ms" in result
        assert result["زمن_الاستجابة_ms"] > 0

    def test_benchmark_has_percentiles(self) -> None:
        result = self.agent.benchmark(SAMPLE_PROMPT)
        assert "مقارنة_بالمعيار" in result
        percentiles = result["مقارنة_بالمعيار"]
        assert "p50_ms" in percentiles
        assert "p95_ms" in percentiles
        assert "p99_ms" in percentiles

    def test_validate_returns_checks_list(self) -> None:
        result = self.agent.validate(SAMPLE_PROMPT)
        assert "فحوصات_التحقق" in result
        checks = result["فحوصات_التحقق"]
        assert isinstance(checks, list)
        assert len(checks) > 0

    def test_validate_pass_rate_in_range(self) -> None:
        result = self.agent.validate(SAMPLE_PROMPT)
        rate = result["نسبة_الاجتياز"]
        assert 0.0 <= rate <= 1.0

    def test_overall_quality_score_calculated(self) -> None:
        thought = self.agent.think(SAMPLE_PROMPT)
        result = self.agent.act(thought, SAMPLE_PROMPT)
        score = result["overall_quality_score"]
        assert 0.0 <= score <= 1.0

    def test_run_success(self) -> None:
        response = self.agent.run(SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE
        assert "audit" in response.result
        assert "benchmark" in response.result


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات AgentOrchestrator
# ═══════════════════════════════════════════════════════════════════════════════


class TestAgentOrchestrator:
    """اختبارات مُنسِّق الوكلاء."""

    def setup_method(self) -> None:
        self.orchestrator = AgentOrchestrator()

    def test_get_status_returns_dict(self) -> None:
        status = AgentOrchestrator.get_status()
        assert isinstance(status, dict)
        assert "available_agents" in status
        assert "status" in status

    def test_get_status_operational(self) -> None:
        status = AgentOrchestrator.get_status()
        assert status["status"] == "operational"

    def test_get_status_has_four_agents(self) -> None:
        status = AgentOrchestrator.get_status()
        assert status["total_agents"] == 4
        assert "creativity" in status["available_agents"]
        assert "development" in status["available_agents"]
        assert "research" in status["available_agents"]
        assert "quality" in status["available_agents"]

    def test_run_single_creativity(self) -> None:
        response = self.orchestrator.run_single("creativity", SAMPLE_REQUEST)
        assert isinstance(response, AgentResponse)
        assert response.status == AgentStatus.DONE
        assert response.agent_type == "creativity"

    def test_run_single_development(self) -> None:
        response = self.orchestrator.run_single("development", SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE

    def test_run_single_research(self) -> None:
        response = self.orchestrator.run_single("research", SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE

    def test_run_single_quality(self) -> None:
        response = self.orchestrator.run_single("quality", SAMPLE_REQUEST)
        assert response.status == AgentStatus.DONE

    def test_run_single_unknown_agent_raises(self) -> None:
        with pytest.raises(ValueError, match="وكيل غير معروف"):
            self.orchestrator.run_single("unknown_agent", SAMPLE_REQUEST)

    def test_run_all_returns_orchestrator_response(self) -> None:
        req = OrchestratorRequest(
            prompt=SAMPLE_PROMPT,
            agents=["creativity", "development"],
        )
        response = self.orchestrator.run_all(req)
        assert isinstance(response, OrchestratorResponse)
        assert "creativity" in response.results
        assert "development" in response.results

    def test_run_all_has_session_id(self) -> None:
        req = OrchestratorRequest(prompt=SAMPLE_PROMPT, agents=["creativity"])
        response = self.orchestrator.run_all(req)
        assert isinstance(response.session_id, str)
        assert len(response.session_id) > 0

    def test_run_all_has_summary(self) -> None:
        req = OrchestratorRequest(prompt=SAMPLE_PROMPT, agents=["quality"])
        response = self.orchestrator.run_all(req)
        assert isinstance(response.summary, str)
        assert len(response.summary) > 10

    def test_run_all_duration_positive(self) -> None:
        req = OrchestratorRequest(prompt=SAMPLE_PROMPT, agents=["research"])
        response = self.orchestrator.run_all(req)
        assert response.total_duration_ms > 0

    def test_run_all_four_agents(self) -> None:
        req = OrchestratorRequest(
            prompt=SAMPLE_PROMPT,
            agents=["creativity", "development", "research", "quality"],
        )
        response = self.orchestrator.run_all(req)
        assert len(response.results) == 4
        for key, val in response.results.items():
            assert val.status == AgentStatus.DONE, f"الوكيل {key} فشل"

    def test_orchestrator_request_validates_agents(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            OrchestratorRequest(prompt=SAMPLE_PROMPT, agents=["invalid_agent"])


# ═══════════════════════════════════════════════════════════════════════════════
# اختبارات API Endpoints — عبر TestClient
# ═══════════════════════════════════════════════════════════════════════════════


class TestAgentsAPI:
    """اختبارات HTTP endpoints للوكلاء."""

    @pytest.fixture(autouse=True)
    def setup_client(self) -> None:
        """إعداد TestClient لاختبار الـ API."""
        from fastapi.testclient import TestClient
        from main import app
        self.client = TestClient(app)

    def _post_agent(self, endpoint: str) -> object:
        """مساعد: يُرسل طلب POST ويُعيد الاستجابة."""
        return self.client.post(
            endpoint,
            json={"prompt": SAMPLE_PROMPT, "language": "ar"},
        )

    def test_agents_status_endpoint(self) -> None:
        """GET /api/agents/status يجب أن يُعيد 200 مع قائمة الوكلاء."""
        response = self.client.get("/api/agents/status")
        assert response.status_code == 200
        data = response.json()
        assert "available_agents" in data
        assert "status" in data
        assert data["status"] == "operational"

    def test_creativity_endpoint(self) -> None:
        """POST /api/agents/creativity يجب أن يُعيد 200 مع نتيجة صالحة."""
        response = self._post_agent("/api/agents/creativity")
        assert response.status_code == 200
        data = response.json()
        assert data["agent_type"] == "creativity"
        assert data["status"] == "done"

    def test_development_endpoint(self) -> None:
        response = self._post_agent("/api/agents/development")
        assert response.status_code == 200
        data = response.json()
        assert data["agent_type"] == "development"

    def test_research_endpoint(self) -> None:
        response = self._post_agent("/api/agents/research")
        assert response.status_code == 200
        data = response.json()
        assert data["agent_type"] == "research"

    def test_quality_endpoint(self) -> None:
        response = self._post_agent("/api/agents/quality")
        assert response.status_code == 200
        data = response.json()
        assert data["agent_type"] == "quality"

    def test_orchestrate_endpoint(self) -> None:
        """POST /api/agents/orchestrate يُشغّل عدة وكلاء معاً."""
        response = self.client.post(
            "/api/agents/orchestrate",
            json={
                "prompt": SAMPLE_PROMPT,
                "agents": ["creativity", "quality"],
                "language": "ar",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "results" in data
        assert "summary" in data
        assert "creativity" in data["results"]
        assert "quality" in data["results"]

    def test_invalid_prompt_returns_422(self) -> None:
        """طلب بدون prompt صالح يجب أن يُعيد 422."""
        response = self.client.post(
            "/api/agents/creativity",
            json={"prompt": "أ", "language": "ar"},
        )
        assert response.status_code == 422

    def test_invalid_language_returns_422(self) -> None:
        """لغة غير مدعومة يجب أن تُعيد 422."""
        response = self.client.post(
            "/api/agents/creativity",
            json={"prompt": "نص كافٍ للاختبار", "language": "fr"},
        )
        assert response.status_code == 422

    def test_response_has_duration(self) -> None:
        """الاستجابة يجب أن تحتوي على زمن التنفيذ."""
        response = self._post_agent("/api/agents/creativity")
        data = response.json()
        assert "duration_ms" in data
        assert data["duration_ms"] >= 0

    def test_response_has_timestamp(self) -> None:
        """الاستجابة يجب أن تحتوي على طابع زمني."""
        response = self._post_agent("/api/agents/quality")
        data = response.json()
        assert "timestamp" in data
        assert data["timestamp"] > 0
