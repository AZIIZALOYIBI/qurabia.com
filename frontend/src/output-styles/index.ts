/**
 * ============================================================
 * output-styles/index.ts - تصدير نظام انماط المخرجات
 * ============================================================
 */
export type { OutputStyleConfig } from './types';
export { BUILT_IN_STYLES } from './types';
export {
  getActiveStyle, setActiveStyle, getAllStyles, getCustomStyles,
  addCustomStyle, removeCustomStyle, getActiveStylePrompt, getStyleByName,
} from './outputStyleManager';
