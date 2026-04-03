/**
 * ============================================================
 * keybindings/defaultBindings.ts – الاختصارات الافتراضية
 * Keybindings System
 * ============================================================
 */

import type { KeybindingBlock } from './types';

/**
 * اختصارات لوحة المفاتيح الافتراضية للوحة التحكم.
 */
export const DEFAULT_BINDINGS: KeybindingBlock[] = [
  {
    context: 'Global',
    bindings: {
      'ctrl+enter': 'app:run',
      'ctrl+shift+r': 'app:reset',
      'ctrl+t': 'app:toggleTheme',
      'ctrl+shift+v': 'app:toggleVisualEngine',
      'ctrl+shift+a': 'app:toggleAnalytics',
      'f1': 'app:help',
      'ctrl+shift+e': 'app:export',
      'escape': 'modal:close',
    },
  },
  {
    context: 'Dashboard',
    bindings: {
      'ctrl+r': 'dashboard:refresh',
      'ctrl+b': 'dashboard:toggleSidebar',
    },
  },
  {
    context: 'Simulation',
    bindings: {
      'ctrl+enter': 'simulation:start',
      'ctrl+shift+s': 'simulation:stop',
      'ctrl+shift+c': 'simulation:configure',
    },
  },
  {
    context: 'BlochSphere',
    bindings: {
      'left': 'bloch:rotateLeft',
      'right': 'bloch:rotateRight',
      'ctrl+0': 'bloch:reset',
    },
  },
  {
    context: 'Innovation',
    bindings: {
      'ctrl+shift+i': 'innovation:runSuite',
    },
  },
  {
    context: 'Modal',
    bindings: {
      'escape': 'modal:close',
      'enter': 'modal:confirm',
    },
  },
];
