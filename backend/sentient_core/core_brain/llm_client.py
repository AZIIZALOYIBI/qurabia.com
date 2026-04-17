# core_brain/llm_client.py

"""
LLM Client Abstraction Layer
Supports both OpenAI and Azure AI Inference (GitHub Models)
"""

import os
from typing import Any


class LLMClient:
    """
    موحد لعملاء نماذج اللغة الكبيرة
    يدعم OpenAI و Azure AI Inference (GitHub Models API)
    """

    def __init__(self):
        self.client: Any = None
        self.client_type: str = "none"
        self.model: str = self._get_model_name()
        self._initialize_client()

    def _get_model_name(self) -> str:
        """يحدد اسم النموذج بناءً على نوع العميل"""
        # إذا كان GITHUB_TOKEN موجوداً، استخدم نموذج GitHub
        if os.getenv("GITHUB_TOKEN") and os.getenv("USE_GITHUB_MODELS", "false").lower() == "true":
            return os.getenv("GITHUB_MODEL", "gpt-4o")
        # وإلا استخدم نموذج OpenAI
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def _initialize_client(self):
        """يهيئ العميل المناسب حسب المتغيرات البيئية"""
        # محاولة 1: Azure AI Inference (GitHub Models)
        github_token = os.getenv("GITHUB_TOKEN")
        use_github = os.getenv("USE_GITHUB_MODELS", "false").lower() == "true"

        if github_token and use_github:
            if self._init_azure_inference(github_token):
                return

        # محاولة 2: OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            if self._init_openai(openai_key):
                return

        # لا يوجد عميل متاح
        print("  ⚠️ No LLM client available (neither Azure AI Inference nor OpenAI)")

    def _init_azure_inference(self, token: str) -> bool:
        """يهيئ Azure AI Inference client"""
        try:
            from azure.ai.inference import ChatCompletionsClient
            from azure.core.credentials import AzureKeyCredential

            endpoint = os.getenv(
                "AZURE_INFERENCE_ENDPOINT",
                "https://models.github.ai/inference"
            )

            self.client = ChatCompletionsClient(
                endpoint=endpoint,
                credential=AzureKeyCredential(token),
            )
            self.client_type = "azure"
            print(f"  ✅ Azure AI Inference client initialized (model: {self.model})")
            return True

        except ImportError:
            print("  ⚠️ azure-ai-inference not installed, falling back to OpenAI")
            return False
        except Exception as exc:
            print(f"  ⚠️ Azure AI Inference init failed: {exc}")
            return False

    def _init_openai(self, api_key: str) -> bool:
        """يهيئ OpenAI client"""
        try:
            from openai import OpenAI

            self.client = OpenAI(api_key=api_key)
            self.client_type = "openai"
            print(f"  ✅ OpenAI client initialized (model: {self.model})")
            return True

        except ImportError:
            print("  ⚠️ openai library not installed")
            return False
        except Exception as exc:
            print(f"  ⚠️ OpenAI init failed: {exc}")
            return False

    def is_available(self) -> bool:
        """يتحقق من توفر العميل"""
        return self.client is not None

    def complete(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        """
        يرسل طلب إكمال إلى نموذج اللغة ويعيد النص المولد

        Args:
            messages: قائمة الرسائل [{"role": "system"/"user", "content": "..."}]
            temperature: درجة حرارة التوليد (0.0-1.0)
            max_tokens: أقصى عدد من الرموز

        Returns:
            النص المولد من النموذج
        """
        if not self.is_available():
            raise RuntimeError("No LLM client available")

        if self.client_type == "azure":
            return self._complete_azure(messages, temperature, max_tokens)
        if self.client_type == "openai":
            return self._complete_openai(messages, temperature, max_tokens)

        raise RuntimeError(f"Unknown client type: {self.client_type}")

    def _complete_azure(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """إكمال باستخدام Azure AI Inference"""
        from azure.ai.inference.models import SystemMessage, UserMessage, AssistantMessage

        # تحويل الرسائل إلى تنسيق Azure
        azure_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                azure_messages.append(SystemMessage(content))
            elif role == "assistant":
                azure_messages.append(AssistantMessage(content))
            else:  # user or any other role
                azure_messages.append(UserMessage(content))

        response = self.client.complete(
            messages=azure_messages,
            model=self.model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content

    def _complete_openai(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """إكمال باستخدام OpenAI"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content
