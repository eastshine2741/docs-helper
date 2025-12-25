import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Storage } from '../shared/utils/storage';
import type { UserSettings } from '../shared/types/userSettings';
import { DEFAULT_SYSTEM_PROMPT } from '../shared/types/userSettings';

/**
 * Options page for DocsChat extension
 * Allows users to configure API keys and system prompt
 */

const OptionsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    apiKeys: {},
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: Date.now(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await Storage.getUserSettings();
        setSettings(stored);
      } catch (error) {
        console.error('[DocsChat] Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Validate Claude API key format
      if (settings.apiKeys.claude && !settings.apiKeys.claude.startsWith('sk-ant-')) {
        setSaveMessage('⚠️ Claude API keys should start with "sk-ant-"');
        setIsSaving(false);
        return;
      }

      // Update timestamp
      const updatedSettings: UserSettings = {
        ...settings,
        updatedAt: Date.now(),
      };

      await Storage.saveUserSettings(updatedSettings);
      setSettings(updatedSettings);
      setSaveMessage('✓ Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('✗ Failed to save settings. Please try again.');
      console.error('[DocsChat] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>DocsChat Options</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>DocsChat Options</h1>
        <p style={styles.subtitle}>
          Configure your API keys and customize the system prompt for LLM interactions
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>API Keys</h2>
        <p style={styles.helperText}>
          Enter your API keys to enable LLM interactions. You need at least one API key configured.
        </p>

        {/* Claude API Key */}
        <div style={styles.field}>
          <label htmlFor="claude-key" style={styles.label}>
            Claude API Key (Anthropic)
          </label>
          <input
            id="claude-key"
            type="text"
            placeholder="sk-ant-..."
            value={settings.apiKeys.claude || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                apiKeys: { ...settings.apiKeys, claude: e.target.value },
              })
            }
            style={styles.input}
          />
          <p style={styles.hint}>
            Get your key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Anthropic Console
            </a>
          </p>
        </div>

        {/* Gemini API Key */}
        <div style={styles.field}>
          <label htmlFor="gemini-key" style={styles.label}>
            Gemini API Key (Google)
          </label>
          <input
            id="gemini-key"
            type="text"
            placeholder="AIzaSy..."
            value={settings.apiKeys.gemini || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                apiKeys: { ...settings.apiKeys, gemini: e.target.value },
              })
            }
            style={styles.input}
          />
          <p style={styles.hint}>
            Get your key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Prompt</h2>
        <p style={styles.helperText}>
          Customize the system prompt to control how the LLM responds to your questions. This is prepended to all
          conversations.
        </p>

        <textarea
          id="system-prompt"
          value={settings.systemPrompt}
          onChange={(e) =>
            setSettings({
              ...settings,
              systemPrompt: e.target.value,
            })
          }
          placeholder="Enter custom system prompt..."
          style={styles.textarea}
          rows={5}
        />
        <p style={styles.hint}>Default: "{DEFAULT_SYSTEM_PROMPT}"</p>
      </div>

      {/* Save Button */}
      <div style={styles.footer}>
        <button onClick={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        {saveMessage && (
          <p
            style={{
              ...styles.message,
              color: saveMessage.includes('✓') ? '#38A169' : saveMessage.includes('⚠') ? '#D69E2E' : '#E53E3E',
            }}
          >
            {saveMessage}
          </p>
        )}
      </div>

      {/* Last Updated */}
      {settings.updatedAt && (
        <p style={styles.timestamp}>Last updated: {new Date(settings.updatedAt).toLocaleString()}</p>
      )}
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#1A202C',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    marginTop: '8px',
  },
  section: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#F7FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#2D3748',
  },
  helperText: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '16px',
  },
  field: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#2D3748',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #CBD5E0',
    borderRadius: '6px',
    fontFamily: 'monospace',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #CBD5E0',
    borderRadius: '6px',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '12px',
    color: '#A0AEC0',
    marginTop: '6px',
  },
  link: {
    color: '#3182CE',
    textDecoration: 'none',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#3182CE',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  message: {
    fontSize: '14px',
    fontWeight: 500,
  },
  timestamp: {
    fontSize: '12px',
    color: '#A0AEC0',
    marginTop: '16px',
    textAlign: 'right',
  },
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
