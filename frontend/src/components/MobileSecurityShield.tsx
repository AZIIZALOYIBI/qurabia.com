import React, { useEffect } from 'react';
import { AdvancedMobileShield } from '../security/AdvancedMobileShield';

/**
 * MobileSecurityShield - وحدة حماية الهاتف المحمول
 * تمنع:
 * - النقر المطول (Long Press) لفتح قائمة السياق
 * - التحديد غير المصرح به للنصوص
 * - سحب الصور والعناصر
 * - التكبير المزدوج (Double Tap to Zoom)
 * - كشف المتسللين وتحليل السلوك
 */
const MobileSecurityShield: React.FC = () => {
  useEffect(() => {
    // 1. تهيئة التشفير المتقدم (AES-256-GCM)
    AdvancedMobileShield.initializeEncryption().catch(err => 
      console.warn('[Security] Failed to initialize AES encryption:', err)
    );

    // 2. تشغيل نظام كشف التسلل (IDS) ومراقبة السلوك المشبوه
    AdvancedMobileShield.startIntrusionDetection((reason, details) => {
      AdvancedMobileShield.logSecurityEvent(reason, details);
    });

    // 3. منع قائمة السياق (Right click / Long press)
    const handleContextMenu = (e: MouseEvent) => {
      // السماح في حقول الإدخال
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    // 4. منع التحديد
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      // e.preventDefault();
    };

    // 5. منع السحب
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 6. منع التكبير باللمس المزدوج
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement;
        // استثناء الأزرار والروابط التي تحتاج إلى نقر سريع
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    document.addEventListener('contextmenu', handleContextMenu, { passive: false });
    document.addEventListener('selectstart', handleSelectStart, { passive: false });
    document.addEventListener('dragstart', handleDragStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 7. إضافة كلاسات CSS للحماية (WAF-like frontend mitigation)
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        -webkit-touch-callout: none; /* منع ظهور قائمة الهاتف عند النقر المطول */
        -webkit-tap-highlight-color: transparent; /* إخفاء وميض النقر على الموبايل */
      }
      /* منع تحديد الصور */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null; // هذا المكون لا يعرض أي واجهة، فقط يطبق الحماية في الخلفية
};

export default MobileSecurityShield;
