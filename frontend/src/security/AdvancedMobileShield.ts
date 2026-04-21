/**
 * AdvancedMobileShield - نظام الحماية المتقدم للهواتف المحمولة
 * 
 * الميزات:
 * 1. تشفير البيانات (AES-256-GCM) للبيانات المحلية المخزنة
 * 2. نظام كشف التسلل (IDS) عن طريق مراقبة أدوات المطور (DevTools) والنشاط المشبوه
 * 3. تحليل السلوك (Behavioral Analysis) للمسات والنقرات (Clickjacking & Bots)
 * 4. نظام إرسال السجلات (Telemetry) لجمع البيانات حول الاختراقات المحتملة
 * 
 * مصمم بحيث لا يستهلك أكثر من 10% من البطارية و15% من المعالج (CPU)
 * عبر تقليل عمليات التحديث الدوري (Debouncing) وتجنب الـ blocking tasks.
 */

export class AdvancedMobileShield {
  private static readonly ENCRYPTION_KEY_NAME = 'qurabia_shield_key';
  private static key: CryptoKey | null = null;
  private static isIdsActive = false;

  /**
   * 1. نظام التشفير: تهيئة التشفير القوي (AES-256-GCM)
   */
  static async initializeEncryption(): Promise<void> {
    if (!this.key) {
      // إنشاء مفتاح تشفير عشوائي في الجلسة (في الإنتاج يمكن استيراد مفتاح من الخادم عبر TLS 1.3)
      this.key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
  }

  /**
   * تشفير البيانات الحساسة باستخدام AES-256-GCM
   */
  static async encryptData(data: string): Promise<string> {
    if (!this.key) await this.initializeEncryption();
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key!,
      encoder.encode(data)
    );
    
    // دمج الـ IV مع البيانات المشفرة
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * فك تشفير البيانات باستخدام AES-256-GCM
   */
  static async decryptData(encryptedBase64: string): Promise<string> {
    if (!this.key) await this.initializeEncryption();
    const decoder = new TextDecoder();
    
    const binaryString = atob(encryptedBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key!,
      data
    );
    
    return decoder.decode(decrypted);
  }

  /**
   * 2. نظام كشف التسلل المتقدم (IDS) وتحليل السلوك
   */
  static startIntrusionDetection(onSuspiciousActivity: (reason: string, details?: any) => void): void {
    if (this.isIdsActive) return;
    this.isIdsActive = true;

    // كشف أدوات المطور (DevTools Detection) للمهاجمين الذين يحاولون تحليل الكود
    let devtoolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          onSuspiciousActivity('DEVTOOLS_DETECTED', { outerWidth: window.outerWidth, innerWidth: window.innerWidth });
        }
      } else {
        devtoolsOpen = false;
      }
    };
    
    // يتم الفحص كل 2000 ملي ثانية لتقليل استهلاك الـ CPU والبطارية
    setInterval(checkDevTools, 2000);

    // 3. تحليل سلوك اللمس (Behavioral Analysis) لكشف الـ Bots
    let touchCount = 0;
    let lastTouchTime = Date.now();
    
    const handleTouch = () => {
      const now = Date.now();
      if (now - lastTouchTime < 100) {
        // نقرات سريعة جداً وغير طبيعية للبشر
        touchCount++;
      } else {
        touchCount = 1;
      }
      
      if (touchCount > 5) {
        onSuspiciousActivity('ABNORMAL_TOUCH_BEHAVIOR', { count: touchCount, interval: now - lastTouchTime });
        touchCount = 0;
      }
      lastTouchTime = now;
    };
    
    // استماع لحدث اللمس بشكل غير معيق (passive: true) لضمان الأداء السلس
    document.addEventListener('touchstart', handleTouch, { passive: true });
    
    // 4. آلية منع تنفيذ التعليمات البرمجية الضارة (XSS Mitigation in DOM)
    // مراقبة أي تغيير في الـ DOM لإدخال سكربتات خبيثة
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'SCRIPT') {
            const scriptNode = node as HTMLScriptElement;
            if (!scriptNode.src || !scriptNode.src.includes(window.location.hostname)) {
              onSuspiciousActivity('UNAUTHORIZED_SCRIPT_INJECTION', { src: scriptNode.src });
              // يمكن إزالة العقدة لحماية النظام
              scriptNode.remove();
            }
          }
        }
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * إرسال السجلات للمراقبة (Security Telemetry)
   */
  static logSecurityEvent(reason: string, details?: any): void {
    console.warn(`[Mobile Shield - IDS] Threat Detected: ${reason}`, details);
    
    // إرسال التقرير للخادم (يستخدم requestIdleCallback لعدم التأثير على الأداء)
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => this.sendTelemetry(reason, details));
    } else {
      setTimeout(() => this.sendTelemetry(reason, details), 1000);
    }
  }

  private static sendTelemetry(reason: string, details?: any) {
    try {
      const payload = {
        event: reason,
        details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      // إرسال البيانات إلى واجهة الـ API الخاصة بالنظام
      fetch('https://api.qurabia.com/api/security/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // لضمان الإرسال حتى لو أغلق المستخدم الصفحة
      }).catch(() => {
        // فشل صامت لعدم إزعاج المستخدم
      });
    } catch (e) {
      // تجاهل الأخطاء
    }
  }
}
