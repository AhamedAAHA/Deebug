import { useRef, useState, useEffect } from 'react';
import { assistantResponses } from '../../data/mockData';
import { getAssistantAnswer } from '../../utils/calculations';
import { askAssistant } from '../../utils/api';

const FORCE_STYLE_ID = 'deebug-ai-force-position';

const FORCE_CSS = `
body .deebug-ai-dock {
  position: fixed !important;
  top: auto !important;
  left: auto !important;
  right: 16px !important;
  bottom: 16px !important;
  z-index: 2147483647 !important;
  display: flex !important;
  flex-direction: column-reverse !important;
  align-items: flex-end !important;
  justify-content: flex-start !important;
  gap: 12px !important;
  width: 380px !important;
  max-width: calc(100vw - 32px) !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  pointer-events: none !important;
  transform: none !important;
  inset: auto 16px 16px auto !important;
}
body .deebug-ai-dock .deebug-ai-fab,
body .deebug-ai-dock .deebug-ai-panel {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  flex: 0 0 auto !important;
  margin: 0 !important;
  pointer-events: auto !important;
}
@media (max-width: 768px) {
  body .deebug-ai-dock {
    right: 12px !important;
    bottom: 12px !important;
    left: auto !important;
    width: min(340px, calc(100vw - 24px)) !important;
    inset: auto 12px 12px auto !important;
  }
}
`;

function applyDockPosition(el) {
  if (!el) return;
  el.style.cssText = [
    'position:fixed',
    'top:auto',
    'left:auto',
    'right:16px',
    'bottom:16px',
    'z-index:2147483647',
    'display:flex',
    'flex-direction:column-reverse',
    'align-items:flex-end',
    'gap:12px',
    'width:380px',
    'max-width:calc(100vw - 32px)',
    'height:auto',
    'margin:0',
    'padding:0',
    'pointer-events:none',
    'transform:none',
  ].join(';');
}

export default function VoiceAssistant() {
  const dockRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello. I am your DaiBoq QS assistant. Ask me about bricks, concrete, steel, paint, or project cost.',
      engine: 'local',
    },
  ]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    applyDockPosition(dockRef.current);
  }, []);

  useEffect(() => {
    document.getElementById('deebug-assistant-root')?.remove();

    if (document.getElementById(FORCE_STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = FORCE_STYLE_ID;
    tag.textContent = FORCE_CSS;
    document.head.appendChild(tag);
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const requestId = ++requestIdRef.current;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    const apiResult = await askAssistant(text);
    if (requestId !== requestIdRef.current) return;

    let answer;
    let engine = 'local';
    let liveAi = false;

    if (apiResult?.answer) {
      answer = apiResult.answer;
      liveAi = Boolean(apiResult.liveAi);
      engine = apiResult.engine || (liveAi ? 'openai' : 'mock');
    } else if (apiResult?.message) {
      const key = getAssistantAnswer(text);
      answer = `${apiResult.message} Using offline guide: ${assistantResponses[key].replace(/\*\*/g, '')}`;
      engine = 'local';
    } else {
      const key = getAssistantAnswer(text);
      answer = assistantResponses[key].replace(/\*\*/g, '');
      engine = 'local';
    }

    setMessages((m) => [
      ...m,
      { role: 'assistant', text: answer, engine, liveAi },
    ]);
    setLoading(false);
  };

  const toggleVoice = () => {
    if (loading) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Voice input is not supported in this browser. Type your question instead.', engine: 'local' },
      ]);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-LK';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      const reason = event.error === 'not-allowed'
        ? 'Microphone access was denied. Allow microphone permission or type your question.'
        : 'Voice input failed. Please try again or type your question.';
      setMessages((m) => [...m, { role: 'assistant', text: reason, engine: 'local' }]);
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.start();
  };

  const engineLabel = (msg) => {
    if (msg.role !== 'assistant' || !msg.engine) return null;
    if (msg.liveAi) return 'OpenAI';
    if (msg.engine === 'mock') return 'Server mock';
    if (msg.engine === 'openai') return 'OpenAI';
    return 'Local guide';
  };

  return (
    <div ref={dockRef} className="deebug-ai-dock" aria-live="polite">
      <button
        type="button"
        className={`deebug-ai-fab assistant-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={open ? 'deebug-ai-panel' : undefined}
        aria-label={open ? 'Close assistant' : 'Open QS assistant'}
      >
        {open ? 'Close' : 'AI'}
      </button>

      {open && (
        <div
          id="deebug-ai-panel"
          className="deebug-ai-panel assistant-panel glass-card"
          style={{ position: 'relative', top: 'auto', left: 'auto', right: 'auto', bottom: 'auto' }}
          role="dialog"
          aria-label="QS Assistant"
        >
          <div className="assistant-header">
            <span className="assistant-avatar">AI</span>
            <div>
              <strong>Voice QS Assistant</strong>
              <span>Powered by DaiBoq AI</span>
            </div>
          </div>
          <div className="assistant-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`assistant-msg assistant-msg--${msg.role}`}>
                {msg.role === 'assistant' && engineLabel(msg) && (
                  <span className="assistant-engine-badge">{engineLabel(msg)}</span>
                )}
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="assistant-msg assistant-msg--assistant assistant-msg--loading">
                Thinking…
              </div>
            )}
          </div>
          <div className="assistant-input-row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
              placeholder="Ask: How many bricks are needed?"
              disabled={loading}
            />
            <button type="button" className={`btn btn-ghost btn-sm ${listening ? 'listening' : ''}`} onClick={toggleVoice} disabled={loading}>
              Voice
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => sendMessage(input)} disabled={loading}>
              Send
            </button>
          </div>
          <div className="assistant-suggestions">
            {['How many bricks?', 'Total concrete volume?', 'Estimated cost?'].map((s) => (
              <button key={s} type="button" className="suggestion-chip" onClick={() => sendMessage(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
