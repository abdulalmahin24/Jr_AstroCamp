// ============================================================
// NASA Jr_AstroCamp — AI Mission Assistant Copilot (Chatbot)
// Unified Knowledge Base Search (Idea 1) + Live Telemetry & Page Context (Idea 2)
// Grounded in NASA Flight Transcripts, BVAD Stoichiometry, and Orbital Physics
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageCircle,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';
import type { User } from '../types/auth';
import {
  getMissionAssistantResponse,
  getContextualQuickPrompts,
  type StudentMentorContext,
} from '../utils/studentMentor';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  senderName: string;
  text: string;
  timestamp: string;
  citations?: string[];
}

interface NasaMissionAssistantChatbotProps {
  currentUser?: User | null;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  floatingMode?: boolean;
  initialMode?: 'mentor' | 'copilot';
  mentorContext?: StudentMentorContext;
  floatingOffsetBottom?: number;
}

export const NasaMissionAssistantChatbot: React.FC<NasaMissionAssistantChatbotProps> = ({
  currentUser,
  isOpen: externalIsOpen,
  onOpen: externalOnOpen,
  onClose: externalOnClose,
  floatingMode = true,
  initialMode = 'mentor',
  mentorContext,
  floatingOffsetBottom = 24,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);
  const [mentorMode, setMentorMode] = useState<'mentor' | 'copilot'>(initialMode);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      senderName: 'Mission Mentor',
      text: "Hi, Cadet! I’m your Mission Mentor. Ask me about your active mission, any of the 76 NASA flights, astronauts, spacesuits, ECLSS math, or how to use the simulators!",
      timestamp: '00:00:01',
      citations: ['NASA Space Apps Student Mentor Framework', 'NASA DONKI Space Weather Database', 'NASA BVAD TP-2015-218570']
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    if (soundEnabled) {
      soundFx.playRadioChirp();
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: currentUser?.username || 'Commander',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      const result = getMissionAssistantResponse(query, mentorContext);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        senderName: mentorMode === 'mentor' ? 'NASA Cadet Mentor' : 'CapCom AI Copilot',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        citations: result.citations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      if (soundEnabled) {
        soundFx.playDsnChirp();
      }
    }, 300);
  };

  const handleSpeakMessage = (text: string) => {
    speechEngine.stop();
    const plainText = text.replace(/[*#$]/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
    speechEngine.speak(plainText, 'SYSTEM_AI');
  };

  const handleToggleOpen = () => {
    if (soundEnabled) {
      soundFx.playClick(850);
    }
    if (isOpen) {
      if (externalOnClose) externalOnClose();
      setInternalIsOpen(false);
    } else {
      if (externalOnOpen) externalOnOpen();
      setInternalIsOpen(true);
    }
  };

  const activePrompts = getContextualQuickPrompts(mentorContext, mentorMode);
  const res = mentorContext?.resources;
  const hasLowResource =
    res !== undefined &&
    ((res.power !== undefined && res.power < 45) ||
      (res.oxygen !== undefined && res.oxygen < 45) ||
      (res.water !== undefined && res.water < 45));

  return (
    <>
      {/* Floating Launcher Widget */}
      {floatingMode && !isOpen && (
        <div
          className="copilot-floating-trigger-btn mentor-floating-widget"
          style={{
            position: 'fixed',
            bottom: `${floatingOffsetBottom}px`,
            right: '24px',
            zIndex: 9990,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
            pointerEvents: 'auto',
            transition: 'bottom 0.25s ease',
          }}
        >
          <div
            style={{
              padding: '7px 18px',
              borderRadius: '9999px',
              background: 'rgba(11, 20, 42, 0.94)',
              border: hasLowResource
                ? '1.5px solid rgba(251, 146, 60, 0.7)'
                : '1.5px solid rgba(56, 189, 248, 0.35)',
              color: hasLowResource ? '#fdba74' : '#f8fafc',
              fontSize: '13.5px',
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(12px)',
              letterSpacing: '0.01em',
              fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
              whiteSpace: 'nowrap',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            {hasLowResource
              ? `⚠️ Sol ${mentorContext?.currentSol ?? 1} Telemetry Alert — Ask Mentor`
              : 'You’re not on this mission alone.'}
          </div>

          <button
            onClick={handleToggleOpen}
            aria-label="Ask your mentor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
              border: '2px solid #38bdf8',
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.45), 0 8px 24px rgba(0,0,0,0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.01em',
            }}
            title="Ask your NASA Student Mentor for guidance"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.65), 0 10px 28px rgba(0,0,0,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.45), 0 8px 24px rgba(0,0,0,0.6)';
            }}
          >
            <MessageCircle size={20} style={{ strokeWidth: 2.2, color: '#ffffff' }} />
            <span>Ask your mentor</span>
          </button>
        </div>
      )}

      {/* Main Chatbot Panel Dialog */}
      {isOpen && (
        <div
          className="copilot-chatbot-window"
          role="dialog"
          aria-label="Mission Mentor"
          style={{
            position: 'fixed',
            bottom: floatingMode ? `${floatingOffsetBottom}px` : '50%',
            right: floatingMode ? '24px' : '50%',
            transform: floatingMode ? 'none' : 'translate(50%, 50%)',
            width: isExpanded ? 'min(780px, calc(100vw - 32px))' : 'min(460px, calc(100vw - 32px))',
            height: isExpanded ? 'min(780px, calc(100vh - 48px))' : 'min(640px, calc(100vh - 48px))',
            zIndex: 9995,
            background: 'linear-gradient(180deg, #091528 0%, #060e1c 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.22)',
            borderRadius: '24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px 12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.14)',
                    border: '1.5px solid rgba(34, 211, 238, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#22d3ee',
                    boxShadow: '0 0 16px rgba(34, 211, 238, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={19} style={{ strokeWidth: 2 }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Mission Mentor
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {mentorMode === 'mentor' ? 'Cadet Mentor • 76-Mission Index' : 'CapCom Technical Copilot'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setMentorMode((m) => (m === 'mentor' ? 'copilot' : 'mentor'))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: mentorMode === 'copilot' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Switch between Cadet Mentor and Technical CapCom prompt suggestions"
                >
                  {mentorMode === 'mentor' ? '🎓 Mentor' : '🛰️ CapCom'}
                </button>
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isExpanded ? 'Compact size' : 'Expand window'}
                >
                  {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
                <button
                  onClick={handleToggleOpen}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Close Mission Mentor"
                >
                  <X size={21} />
                </button>
              </div>
            </div>

            {/* Live Outpost Telemetry Strip (Idea 2) */}
            {res && (
              <button
                onClick={() => handleSendMessage('Diagnose my low outpost resources!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: hasLowResource ? 'rgba(124, 45, 18, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                  border: hasLowResource
                    ? '1px solid rgba(251, 146, 60, 0.5)'
                    : '1px solid rgba(56, 189, 248, 0.18)',
                  color: '#cbd5e1',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                title="Click for live outpost telemetry diagnostic"
              >
                <span>
                  {mentorContext?.destination === 'MARS' ? '🔴 MARS' : '🌕 MOON'} • Sol {mentorContext?.currentSol ?? 1}
                </span>
                <span>
                  ⚡{Math.round(res.power ?? 0)}% • 🫁{Math.round(res.oxygen ?? 0)}% • 💧{Math.round(res.water ?? 0)}%
                </span>
              </button>
            )}
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              if (isUser) {
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(3, 105, 161, 0.5) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    background: '#0b192e',
                    border: '1px solid rgba(30, 58, 95, 0.75)',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: '#38bdf8',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {msg.senderName || 'MISSION MENTOR'}
                  </div>
                  <div
                    style={{
                      color: '#e2e8f0',
                      fontSize: '14.5px',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '10px',
                      }}
                    >
                      {msg.citations.map((cit, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#7dd3fc',
                          }}
                        >
                          📎 {cit}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleSpeakMessage(msg.text)}
                    style={{
                      marginTop: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      padding: '2px 4px',
                    }}
                    title="Listen to Mentor Audio"
                  >
                    <Volume2 size={13} className="text-cyan-400" />
                    <span>Read aloud</span>
                  </button>
                </div>
              );
            })}

            {/* Context-Aware Quick Prompt Pills (Idea 2) */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {activePrompts.map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => handleSendMessage(promptText)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(11, 25, 45, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.background = 'rgba(14, 38, 70, 0.95)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                    e.currentTarget.style.background = 'rgba(11, 25, 45, 0.85)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Thinking / Uplink indicator */}
            {isThinking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  padding: '8px 14px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '12px',
                  width: 'fit-content',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    animation: 'pulse 1s infinite',
                  }}
                />
                <span>Searching Jr_AstroCamp knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Form & Disclaimer */}
          <div
            style={{
              padding: '12px 20px 16px 20px',
              background: 'rgba(8, 16, 28, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(7, 18, 34, 0.95)',
                  border: '2px solid rgba(251, 146, 60, 0.85)',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  boxShadow: '0 0 14px rgba(251, 146, 60, 0.25)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask about missions, astronauts, simulators, or your outpost..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    caretColor: '#fb923c',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!inputQuery.trim() || isThinking}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: inputQuery.trim()
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(15, 26, 44, 0.65)',
                  border: inputQuery.trim()
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: inputQuery.trim() ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputQuery.trim() ? 'pointer' : 'default',
                  transition: 'all 0.18s ease',
                  flexShrink: 0,
                }}
                title="Send question to Mission Mentor"
              >
                <Send size={18} />
              </button>
            </form>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '10px',
                lineHeight: 1.4,
              }}
            >
              A learning guide, not a live person. Grounded in Jr_AstroCamp’s 76 NASA missions & curriculum data.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NasaMissionAssistantChatbot;
