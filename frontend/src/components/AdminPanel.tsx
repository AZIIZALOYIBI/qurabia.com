import type React from 'react';
import { useState } from 'react';
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE } from '../utils/api';

interface AdminPanelProps {
  onClose?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [adminCode, setAdminCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (!apiKey.trim()) {
        setMessage({ type: 'error', text: 'يرجى إدخال مفتاح OpenRouter API' });
        setLoading(false);
        return;
      }

      if (!adminCode.trim()) {
        setMessage({ type: 'error', text: 'يرجى إدخال رمز الإدارة' });
        setLoading(false);
        return;
      }

      const apiBase = API_BASE || window.location.origin;
      const response = await fetch(`${apiBase}/api/admin/openrouter/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Code': adminCode,
        },
        body: JSON.stringify({
          api_key: apiKey,
          model: model,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessage({ type: 'success', text: '✓ تم حفظ مفتاح OpenRouter بنجاح' });
      setApiKey('');
      setAdminCode('');

      // إغلاق بعد ثانيتين
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'فشل حفظ المفتاح',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label="لوحة الإدارة"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 500 }}
      >
        <div className="ui-modal-header">
          <div className="ui-modal-title">
            <div className="ui-icon-btn" aria-hidden="true">
              <Key size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <strong>إدارة OpenRouter</strong>
              <span>حفظ مفتاح API</span>
            </div>
          </div>
          <button type="button" className="ui-btn ui-btn-danger" onClick={onClose} aria-label="إغلاق">
            إغلاق
          </button>
        </div>

        <div className="ui-modal-body" style={{ padding: 16, display: 'grid', gap: 16 }}>
          <div className="ui-field">
            <label htmlFor="admin-code" className="ui-label">
              رمز الإدارة
            </label>
            <input
              id="admin-code"
              className="ui-input"
              type="password"
              placeholder="QURABIA-ADMIN-2026-..."
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="ui-field">
            <label htmlFor="api-key" className="ui-label">
              مفتاح OpenRouter API
            </label>
            <input
              id="api-key"
              className="ui-input"
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="ui-field">
            <label htmlFor="model" className="ui-label">
              النموذج
            </label>
            <select
              id="model"
              className="ui-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
              <option value="openai/gpt-4o">openai/gpt-4o</option>
              <option value="openai/gpt-3.5-turbo">openai/gpt-3.5-turbo</option>
              <option value="anthropic/claude-3-opus">anthropic/claude-3-opus</option>
              <option value="anthropic/claude-3-sonnet">anthropic/claude-3-sonnet</option>
              <option value="xai/grok-2">xai/grok-2</option>
            </select>
          </div>

          {message && (
            <div
              className="ui-chip"
              style={{
                borderColor: message.type === 'success' ? 'rgba(0,200,100,0.35)' : 'rgba(255,60,120,0.35)',
                color: message.type === 'success' ? 'var(--q-success)' : 'var(--q-danger)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          <button
            type="button"
            className="ui-btn ui-btn-filled"
            onClick={handleSave}
            disabled={loading}
            aria-label="حفظ المفتاح"
          >
            <Save size={16} />
            {loading ? 'جارٍ الحفظ…' : 'حفظ المفتاح'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
