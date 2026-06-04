import { useRef, useState } from 'react';
import { assistantResponses } from '../../data/mockData';
import { getAssistantAnswer } from '../../utils/calculations';
import { askAssistant } from '../../utils/api';
import '../../styles/assistant.css';

export default function VoiceAssistant() {
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
    <>
      <button
        type="button"
        className={`assistant-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="QS Assistant"
      >
        {open ? 'Close' : 'AI'}
      </button>
      {open && (
        <div className="assistant-panel glass-card">
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
    </>
  );
}
