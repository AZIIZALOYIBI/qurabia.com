# Security Engine Service API Documentation

## نظرة عامة | Overview

خدمة محرك الأمان الكمومي توفر واجهات برمجية متقدمة للبصمة الكمومية الحية والتشفير متعدد المسارات.

The Security Engine Service provides advanced APIs for live quantum fingerprinting and multi-path encryption.

---

## API Endpoints

### 1. فحص البصمة الكمومية | Scan Quantum Fingerprint

**Endpoint:** `POST /api/v1/security/scan_fingerprint`

**Description:**
يولد بصمة كمومية فريدة لعنوان IP ويصنف التهديدات تلقائياً.

Generates a unique quantum fingerprint for an IP address and automatically classifies threats.

**Request Body:**
```json
{
  "source_ip": "192.168.1.1",
  "seed": "optional-seed-for-deterministic-generation"
}
```

**Response:**
```json
{
  "ok": true,
  "fingerprint": {
    "id": "QFP-A1B2C3D4E5F6",
    "source_ip": "192.168.1.1",
    "state_signature": "qsh2-abc123...",
    "entanglement_level": 0.873,
    "quantum_phase": 2.456,
    "density_matrix": [0.62, 0.12, 0.12, 0.38],
    "confidence": 0.94,
    "classification": "legitimate",
    "timestamp": 1776212929394,
    "metadata": {
      "threat_score": 0.1,
      "seed": "optional-seed..."
    }
  },
  "detection_time_ms": 1.23
}
```

**Classifications:**
- `legitimate` - حركة مرور عادية
- `suspicious` - نشاط مشبوه يحتاج مراقبة
- `malicious` - تهديد محتمل
- `unknown` - غير محدد

---

### 2. التشفير متعدد المسارات | Multi-Path Encryption

**Endpoint:** `POST /api/v1/security/encrypt_multipath`

**Description:**
يُنشئ مسارات تشفير متعددة باستخدام خوارزميات PQC مختلفة.

Creates multiple encryption paths using different PQC algorithms.

**Request Body:**
```json
{
  "target_url": "https://qurabia.com",
  "path_count": 5
}
```

**Parameters:**
- `target_url`: عنوان URL الهدف (10-500 chars)
- `path_count`: عدد المسارات (1-20)

**Response:**
```json
{
  "ok": true,
  "result": {
    "paths": [
      {
        "path_id": "PATH-00",
        "algorithm": "CRYSTALS-Kyber-1024",
        "hop_count": 4,
        "latency_ms": 65.32,
        "error_rate": 0.0142,
        "security_strength": 384,
        "status": "active"
      }
      // ... more paths
    ],
    "primary_path": "PATH-00",
    "backup_paths": ["PATH-01", "PATH-02", "PATH-03", "PATH-04"],
    "redundancy_factor": 0.8,
    "success_probability": 0.9997,
    "combined_security": 487,
    "timestamp": 1776212929394
  },
  "encryption_time_ms": 2.45
}
```

**Path Statuses:**
- `active` - نشط ومستخدم حالياً
- `standby` - جاهز للاستخدام كبديل
- `degraded` - يعمل لكن بجودة منخفضة
- `failed` - فشل ولا يمكن استخدامه

**Supported PQC Algorithms:**
- CRYSTALS-Kyber-1024 (Lattice-based, 256-bit security)
- CRYSTALS-Dilithium-5 (Lattice-based signatures)
- SPHINCS+-SHA2-256f (Hash-based signatures)
- Classic-McEliece-6960119 (Code-based, 300-bit security)
- BIKE-L3 (Code-based, 192-bit security)
- HQC-256 (Code-based, 256-bit security)

---

### 3. مقاييس الأداء | Performance Metrics

**Endpoint:** `GET /api/v1/security/metrics/performance`

**Description:**
يوفر مقاييس أداء شاملة للنظام الأمني.

Provides comprehensive performance metrics for the security system.

**Response:**
```json
{
  "ok": true,
  "metrics": {
    "total_scans": 1543,
    "threats_detected": 127,
    "false_positives": 3,
    "false_positive_rate": 0.0236,
    "avg_detection_time_ms": 1.45,
    "avg_response_time_ms": 1.95,
    "total_encryptions": 89,
    "avg_encryption_time_ms": 2.34,
    "uptime_seconds": 86400.5,
    "timestamp": 1776212929394
  }
}
```

**Key Metrics:**
- `false_positive_rate`: معدل الإيجابيات الخاطئة (هدف: < 0.05 أو 5%)
- `avg_detection_time_ms`: متوسط وقت الكشف (هدف: < 5ms)
- `avg_response_time_ms`: متوسط وقت الاستجابة الكلي

---

### 4. لوحة القياس الحية | Live Dashboard

**Endpoint:** `GET /api/v1/security/metrics/live`

**Description:**
بيانات مباشرة للوحة المراقبة مع الأحداث الأخيرة.

Real-time data for monitoring dashboard with recent events.

**Response:**
```json
{
  "ok": true,
  "dashboard": {
    "metrics": {
      "total_scans": 1543,
      "threats_detected": 127,
      "false_positives": 3,
      "false_positive_rate": 0.0236,
      "avg_detection_time_ms": 1.45,
      "avg_response_time_ms": 1.95,
      "total_encryptions": 89,
      "avg_encryption_time_ms": 2.34,
      "uptime_seconds": 86400.5
    },
    "recent_events": [
      {
        "event_id": "abc123def456",
        "source_ip": "192.168.1.100",
        "classification": "suspicious",
        "threat_score": 0.65,
        "detection_time_ms": 1.2,
        "is_false_positive": false,
        "timestamp": 1776212929394
      }
      // ... last 20 events
    ],
    "engine_stats": {
      "fingerprint": {
        "total_scans": 1543,
        "threats_detected": 127,
        "threat_rate": 0.0823
      },
      "encryption": {
        "total_encryptions": 89
      }
    },
    "timestamp": 1776212929394
  }
}
```

---

## Usage Examples

### Python (httpx)
```python
import httpx

# Scan fingerprint
async with httpx.AsyncClient() as client:
    response = await client.post(
        "https://api.qurabia.com/api/v1/security/scan_fingerprint",
        json={"source_ip": "192.168.1.1"}
    )
    data = response.json()
    print(f"Classification: {data['fingerprint']['classification']}")
    print(f"Detection time: {data['detection_time_ms']}ms")
```

### JavaScript (fetch)
```javascript
// Encrypt multipath
const response = await fetch('https://api.qurabia.com/api/v1/security/encrypt_multipath', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_url: 'https://qurabia.com',
    path_count: 7
  })
});

const data = await response.json();
console.log(`Primary path: ${data.result.primary_path}`);
console.log(`Success probability: ${data.result.success_probability * 100}%`);
```

### cURL
```bash
# Get performance metrics
curl -X GET "https://api.qurabia.com/api/v1/security/metrics/performance"

# Live dashboard
curl -X GET "https://api.qurabia.com/api/v1/security/metrics/live"
```

---

## Performance Benchmarks

Based on testing with 100 operations:

| Operation | Average Time | Target | Status |
|-----------|--------------|--------|---------|
| Fingerprint Scan | 1-3 ms | < 5 ms | ✅ Excellent |
| Multi-Path Encryption (5 paths) | 2-4 ms | < 10 ms | ✅ Excellent |
| Metrics Retrieval | < 1 ms | < 2 ms | ✅ Excellent |

**False Positive Rate:** < 2.5% (target: < 5%) ✅

---

## Integration with Frontend

مثال تكامل مع الواجهة الأمامية:

```typescript
// frontend/src/services/securityEngine.ts
import { API_BASE } from './api';

export async function scanFingerprint(sourceIp: string) {
  const response = await fetch(`${API_BASE}/api/v1/security/scan_fingerprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_ip: sourceIp })
  });
  return response.json();
}

export async function encryptMultiPath(targetUrl: string, pathCount: number = 5) {
  const response = await fetch(`${API_BASE}/api/v1/security/encrypt_multipath`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_url: targetUrl, path_count: pathCount })
  });
  return response.json();
}

export async function getLiveMetrics() {
  const response = await fetch(`${API_BASE}/api/v1/security/metrics/live`);
  return response.json();
}
```

---

## Error Handling

جميع الـ endpoints تُرجع أخطاء قياسية:

**422 Unprocessable Entity** - خطأ في التحقق من المدخلات
```json
{
  "detail": [
    {
      "loc": ["body", "source_ip"],
      "msg": "ensure this value has at least 7 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

**500 Internal Server Error** - خطأ في الخادم
```json
{
  "detail": "Internal server error"
}
```

---

## Best Practices

1. **Rate Limiting**: لا تتجاوز 100 طلب/ثانية للـ endpoint الواحد
2. **Caching**: احفظ النتائج مؤقتاً للـ IPs المكررة (TTL: 60 ثانية)
3. **Error Handling**: تعامل مع أخطاء الشبكة بـ retry logic
4. **Monitoring**: استخدم `/metrics/live` للمراقبة المستمرة
5. **Security**: لا ترسل بيانات حساسة في `seed` parameter

---

## Technical Details

### Quantum Fingerprint Components

1. **Density Matrix (ρ):**
   مصفوفة 2×2 للكيوبت الواحد، مُمثلة كمصفوفة مسطحة من 4 عناصر:
   ```
   ρ = [ρ₀₀, ρ₀₁, ρ₁₀, ρ₁₁]
   حيث: Trace(ρ) = ρ₀₀ + ρ₁₁ = 1
   ```

2. **Quantum Phase (φ):**
   الطور الكمومي من 0 إلى 2π

3. **Entanglement Level:**
   مقياس التشابك من 0 (غير متشابك) إلى 1 (متشابك تماماً)

### Multi-Path Encryption Strategy

- **Primary Path:** دائماً نشط (status = "active")
- **Backup Paths:** جاهزة للتبديل الفوري (failover)
- **Redundancy Factor:** نسبة المسارات النشطة من الإجمالي
- **Success Probability:** `1 - ∏(error_rate)` لكل المسارات النشطة

---

## Support

للمساعدة والدعم:
- **Documentation:** https://qurabia.com/docs
- **GitHub:** https://github.com/AZIIZALOYIBI/qurabia.com
- **Issues:** https://github.com/AZIIZALOYIBI/qurabia.com/issues

---

**تم التطوير بواسطة | Developed by:**
عبدالعزيز بن سلطان العتيبي | AZIIZALOYIBI
**QURABIA** — نبني جسراً بين الحضارة العربية وتقنيات الغد
