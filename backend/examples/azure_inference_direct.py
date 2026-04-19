#!/usr/bin/env python3
"""
مثال محسّن: الاستخدام المباشر لـ Azure AI Inference مع GitHub Models API

هذا المثال يوضح كيفية استخدام Azure AI Inference API مباشرةً
بدون طبقة التجريد (LLMClient)، مع تحسينات شاملة.

المتطلبات:
- pip install azure-ai-inference
- تعيين متغير البيئة GITHUB_TOKEN

الميزات:
- دعم temperature و top_p
- معالجة أخطاء شاملة
- أمثلة متعددة (استعلامات بسيطة، توليد كود، ترجمة)
- دعم النماذج المختلفة (GPT-4, GPT-4o, GPT-3.5)
"""

import os
import sys
from typing import List, Optional

try:
    from azure.ai.inference import ChatCompletionsClient
    from azure.ai.inference.models import (
        AssistantMessage,
        SystemMessage,
        UserMessage,
    )
    from azure.core.credentials import AzureKeyCredential
except ImportError:
    print("❌ Error: azure-ai-inference not installed")
    print("   Install with: pip install azure-ai-inference")
    sys.exit(1)


class AzureInferenceExample:
    """فئة لتوضيح استخدام Azure AI Inference API"""

    def __init__(
        self,
        token: Optional[str] = None,
        endpoint: str = "https://models.github.ai/inference",
        model: str = "gpt-4o-mini",
    ):
        """
        تهيئة العميل

        Args:
            token: رمز GitHub (أو None لاستخدام المتغير البيئي)
            endpoint: نقطة النهاية للـ API
            model: اسم النموذج المستخدم
        """
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        if not self.token:
            raise ValueError(
                "GITHUB_TOKEN is required. Set it as environment variable or pass it to constructor."
            )

        self.endpoint = endpoint
        self.model = model

        # إنشاء العميل
        self.client = ChatCompletionsClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.token),
        )

    def complete(
        self,
        messages: List,
        temperature: float = 1.0,
        top_p: float = 1.0,
        max_tokens: int = 1000,
    ) -> str:
        """
        إرسال طلب إكمال للنموذج

        Args:
            messages: قائمة الرسائل (SystemMessage, UserMessage, AssistantMessage)
            temperature: درجة الحرارة (0.0-2.0) - تحكم في العشوائية
            top_p: nucleus sampling (0.0-1.0) - تحكم في التنوع
            max_tokens: أقصى عدد من الرموز المولدة

        Returns:
            النص المولد من النموذج
        """
        try:
            response = self.client.complete(
                messages=messages,
                model=self.model,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"❌ Error during completion: {e}")
            raise


def example_1_simple_question():
    """مثال 1: سؤال بسيط"""
    print("\n" + "=" * 70)
    print("مثال 1: سؤال بسيط - ما هي عاصمة فرنسا؟")
    print("=" * 70)

    client = AzureInferenceExample(model="gpt-4o-mini")

    messages = [
        SystemMessage("You are a helpful assistant."),
        UserMessage("What is the capital of France?"),
    ]

    response = client.complete(
        messages=messages,
        temperature=0.7,
        top_p=0.9,
        max_tokens=100,
    )

    print(f"\n📝 Response:\n{response}")
    print(f"\n⚙️  Parameters: temperature=0.7, top_p=0.9, model={client.model}")


def example_2_code_generation():
    """مثال 2: توليد كود"""
    print("\n" + "=" * 70)
    print("مثال 2: توليد كود Python")
    print("=" * 70)

    client = AzureInferenceExample(model="gpt-4o-mini")

    messages = [
        SystemMessage(
            "You are an expert Python programmer. Write clean, well-documented code."
        ),
        UserMessage("Write a Python function to calculate fibonacci numbers using memoization."),
    ]

    response = client.complete(
        messages=messages,
        temperature=0.3,  # درجة حرارة منخفضة للحصول على كود أكثر دقة
        top_p=0.95,
        max_tokens=500,
    )

    print(f"\n💻 Generated Code:\n{response}")
    print(f"\n⚙️  Parameters: temperature=0.3, top_p=0.95, model={client.model}")


def example_3_arabic_translation():
    """مثال 3: ترجمة إلى العربية"""
    print("\n" + "=" * 70)
    print("مثال 3: ترجمة نص إلى العربية")
    print("=" * 70)

    client = AzureInferenceExample(model="gpt-4o-mini")

    messages = [
        SystemMessage("You are a professional translator. Translate text to Arabic accurately."),
        UserMessage(
            "Translate the following to Arabic: "
            "'Artificial Intelligence is transforming the world.'"
        ),
    ]

    response = client.complete(
        messages=messages,
        temperature=0.5,
        top_p=0.9,
        max_tokens=200,
    )

    print(f"\n🌍 Translation:\n{response}")
    print(f"\n⚙️  Parameters: temperature=0.5, top_p=0.9, model={client.model}")


def example_4_conversation():
    """مثال 4: محادثة متعددة الأدوار"""
    print("\n" + "=" * 70)
    print("مثال 4: محادثة متعددة الأدوار")
    print("=" * 70)

    client = AzureInferenceExample(model="gpt-4o-mini")

    messages = [
        SystemMessage("You are a helpful AI assistant for a quantum computing platform."),
        UserMessage("What is quantum entanglement?"),
        AssistantMessage(
            "Quantum entanglement is a phenomenon where two or more particles become "
            "correlated in such a way that the quantum state of one particle cannot be "
            "described independently of the others, even when separated by large distances."
        ),
        UserMessage("Can you give me a simple analogy?"),
    ]

    response = client.complete(
        messages=messages,
        temperature=0.8,
        top_p=0.95,
        max_tokens=300,
    )

    print(f"\n💬 Conversation Response:\n{response}")
    print(f"\n⚙️  Parameters: temperature=0.8, top_p=0.95, model={client.model}")


def example_5_model_comparison():
    """مثال 5: مقارنة النماذج المختلفة"""
    print("\n" + "=" * 70)
    print("مثال 5: مقارنة النماذج المختلفة")
    print("=" * 70)

    models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
    question = "Explain quantum superposition in one sentence."

    messages = [
        SystemMessage("You are a quantum physics expert. Explain concepts concisely."),
        UserMessage(question),
    ]

    for model in models:
        try:
            client = AzureInferenceExample(model=model)
            response = client.complete(
                messages=messages,
                temperature=0.5,
                top_p=0.9,
                max_tokens=100,
            )
            print(f"\n📊 Model: {model}")
            print(f"   Response: {response}")
        except Exception as e:
            print(f"\n⚠️  Model {model} failed: {e}")


def main():
    """تشغيل جميع الأمثلة"""
    print("🤖 Azure AI Inference Direct API Usage - Enhanced Examples")
    print("🚀 QURABIA Platform - GitHub Models Integration")

    # التحقق من توفر الرمز
    if not os.environ.get("GITHUB_TOKEN"):
        print("\n❌ Error: GITHUB_TOKEN environment variable is not set")
        print("   Please set it with: export GITHUB_TOKEN='your-token-here'")
        return

    try:
        # تشغيل الأمثلة
        example_1_simple_question()
        example_2_code_generation()
        example_3_arabic_translation()
        example_4_conversation()
        example_5_model_comparison()

        print("\n" + "=" * 70)
        print("✅ All examples completed successfully!")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
