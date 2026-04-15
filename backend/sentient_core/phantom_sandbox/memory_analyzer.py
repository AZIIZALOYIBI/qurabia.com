# phantom_sandbox/memory_analyzer.py

import statistics
import subprocess
import time


class MemoryAnalyzer:
    """
    كاشف تسرب الذاكرة: يراقب استهلاك الذاكرة عبر الزمن
    يكتشف التسربات البطيئة التي لا يراها المطور
    """

    def __init__(self, container_name: str, base_url: str):
        self.container_name = container_name
        self.base_url = base_url
        self.memory_readings: list = []
        self.leak_detected = False
        self.leak_details: dict = {}

    def monitor_during_probes(self, duration_seconds: int = 30, interval: int = 3):
        """
        يراقب الذاكرة أثناء إرسال طلبات مستمرة
        إذا استمرت الذاكرة بالارتفاع دون استقرار → تسرب
        """
        print(f"  🧠 Memory monitoring started for {duration_seconds}s...")

        start_time = time.time()
        request_count = 0

        while time.time() - start_time < duration_seconds:
            # قراءة استهلاك الذاكرة من الحاوية
            mem_info = self._read_container_memory()

            # إرسال طلب للحفاظ على الضغط
            try:
                subprocess.run(
                    ["curl", "-s", "-o", "/dev/null", f"{self.base_url}/"],
                    capture_output=True, timeout=5
                )
                request_count += 1
            except Exception:
                pass

            reading = {
                "timestamp": time.time() - start_time,
                "memory_mb": mem_info.get("used_mb", 0),
                "memory_percent": mem_info.get("percent", 0),
                "request_number": request_count,
            }
            self.memory_readings.append(reading)

            time.sleep(interval)

        # تحليل القراءات
        self._analyze_for_leaks()

    def _read_container_memory(self) -> dict:
        """يقرأ إحصائيات ذاكرة الحاوية"""
        try:
            result = subprocess.run(
                ["docker", "stats", self.container_name, "--no-stream", "--format",
                 "{{.MemUsage}}"],
                capture_output=True, text=True, timeout=10
            )

            if result.stdout:
                # التنسيق: "15.5MiB / 512MiB"
                parts = result.stdout.strip().split("/")
                if len(parts) == 2:
                    used_str = parts[0].strip()
                    used_mb = self._parse_memory_string(used_str)
                    return {"used_mb": used_mb, "percent": 0}
        except Exception:
            pass
        return {"used_mb": 0, "percent": 0}

    def _parse_memory_string(self, s: str) -> float:
        """يحول سلسلة الذاكرة إلى ميغابايت"""
        s = s.strip().upper()
        try:
            if "GIB" in s or "GB" in s:
                return float(s.replace("GIB", "").replace("GB", "").strip()) * 1024
            elif "MIB" in s or "MB" in s:
                return float(s.replace("MIB", "").replace("MB", "").strip())
            elif "KIB" in s or "KB" in s:
                return float(s.replace("KIB", "").replace("KB", "").strip()) / 1024
        except Exception:
            pass
        return 0

    def _analyze_for_leaks(self):
        """
        يحلل قراءات الذاكرة ليكتشف التسرب
        الخوارزمية: انحدار خطي + مقارنة الأثلاث
        """
        if len(self.memory_readings) < 5:
            return

        values = [r["memory_mb"] for r in self.memory_readings]

        # ── الطريقة 1: مقارنة الأثلاث ──
        third = len(values) // 3
        first_third = values[:third]
        middle_third = values[third:2*third]
        last_third = values[2*third:]

        avg_first = statistics.mean(first_third) if first_third else 0
        avg_middle = statistics.mean(middle_third) if middle_third else 0
        avg_last = statistics.mean(last_third) if last_third else 0

        # ── الطريقة 2: الانحدار الخطي (Slope) ──
        n = len(values)
        x_mean = (n - 1) / 2
        y_mean = statistics.mean(values)

        numerator = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        slope = numerator / denominator if denominator else 0  # MB per reading

        # ── الحكم ──
        is_ascending = avg_last > avg_middle > avg_first
        significant_growth = (avg_last - avg_first) > 10  # أكثر من 10 MB نمو
        positive_slope = slope > 0.5  # أكثر من 0.5 MB نمو لكل قراءة

        if is_ascending and significant_growth and positive_slope:
            self.leak_detected = True
            self.leak_details = {
                "growth_mb": round(avg_last - avg_first, 2),
                "slope_mb_per_reading": round(slope, 4),
                "first_third_avg_mb": round(avg_first, 2),
                "last_third_avg_mb": round(avg_last, 2),
                "readings_count": len(values),
                "severity": "HIGH" if (avg_last - avg_first) > 50 else "MEDIUM"
            }
            print(f"  🩸 MEMORY LEAK DETECTED! Growth: {self.leak_details['growth_mb']}MB "
                  f"over {len(values)} readings")
        else:
            print(f"  🧠 Memory stable: {avg_first:.1f}MB → {avg_last:.1f}MB (Δ={avg_last-avg_first:.1f}MB)")

    def get_report(self) -> dict:
        """يعيد تقريراً كاملاً عن الذاكرة"""
        return {
            "leak_detected": self.leak_detected,
            "leak_details": self.leak_details,
            "readings_count": len(self.memory_readings),
            "peak_memory_mb": max((r["memory_mb"] for r in self.memory_readings), default=0),
            "memory_timeline": self.memory_readings[-10:],  # آخر 10 قراءات
        }
