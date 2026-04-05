import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  Brain, GitBranch, FileSearch, Code,
  CheckCircle, Play, AlertCircle, Zap,
  ChevronDown, ChevronRight, Copy, Check,
  Layers, Activity, Clock, Terminal,
  Star, AlertTriangle
} from 'lucide-react';
import './App.css';

// ─── Config ─────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-155617.up.railway.app/';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://web-production-155617.up.railway.app/';

// ─── Types ──────────────────────────────────────────────────────
interface Message {
  type: string;
  data: any;
  timestamp: string;
}

// ─── Color Palette ──────────────────────────────────────────────
const COLORS = {
  bg: '#0c0a1a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.06)',
  borderFocus: 'rgba(159,122,234,0.5)',
  text: '#e2e8f0',
  textMuted: '#718096',
  textDim: '#4a5568',
  purple: '#9f7aea',
  purpleGlow: 'rgba(159,122,234,0.15)',
  blue: '#63b3ed',
  blueGlow: 'rgba(99,179,237,0.15)',
  cyan: '#00b5d8',
  cyanGlow: 'rgba(0,181,216,0.15)',
  green: '#48bb78',
  greenGlow: 'rgba(72,187,120,0.15)',
  yellow: '#f6e05e',
  yellowGlow: 'rgba(246,224,94,0.15)',
  red: '#fc8181',
  redGlow: 'rgba(252,129,129,0.15)',
  orange: '#f6ad55',
  orangeGlow: 'rgba(246,173,85,0.15)',
  gradientPrimary: 'linear-gradient(135deg, #9f7aea 0%, #d53f8c 100%)',
  gradientBg: 'linear-gradient(160deg, #0c0a1a 0%, #1a103a 40%, #2d1045 70%, #1a0a2e 100%)',
};

// ─── Agent Config ───────────────────────────────────────────────
const AGENT_CONFIG: Record<string, { label: string; color: string; glow: string; icon: any; emoji: string }> = {
  start:      { label: 'System',      color: COLORS.purple, glow: COLORS.purpleGlow, icon: Activity,    emoji: '🚀' },
  iteration:  { label: 'Orchestrator', color: COLORS.textMuted, glow: 'rgba(255,255,255,0.03)', icon: Layers, emoji: '🔄' },
  decision:   { label: 'Orchestrator', color: COLORS.purple, glow: COLORS.purpleGlow, icon: Brain,      emoji: '🧠' },
  plan:       { label: 'Planner',      color: COLORS.blue,   glow: COLORS.blueGlow,   icon: GitBranch,  emoji: '📋' },
  research:   { label: 'Researcher',   color: COLORS.cyan,   glow: COLORS.cyanGlow,   icon: FileSearch, emoji: '🔍' },
  code:       { label: 'Coder',        color: COLORS.green,  glow: COLORS.greenGlow,  icon: Code,       emoji: '💻' },
  review:     { label: 'Reviewer',     color: COLORS.yellow, glow: COLORS.yellowGlow, icon: Zap,        emoji: '⚡' },
  complete:   { label: 'Complete',     color: COLORS.green,  glow: COLORS.greenGlow,  icon: CheckCircle, emoji: '✅' },
  error:      { label: 'Error',        color: COLORS.red,    glow: COLORS.redGlow,    icon: AlertCircle, emoji: '❌' },
  max_iterations: { label: 'Timeout', color: COLORS.orange, glow: COLORS.orangeGlow, icon: AlertTriangle, emoji: '⏰' },
};

const AGENT_STEPS = ['decision', 'plan', 'research', 'code', 'review'];

// ─── Helpers ────────────────────────────────────────────────────
function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ─── Collapsible Section ────────────────────────────────────────
function Collapsible({ title, children, defaultOpen = false, color = COLORS.text }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          color,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '0.25rem 0',
          opacity: 0.8,
          letterSpacing: '0.5px',
          textTransform: 'uppercase' as const,
        }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && (
        <div style={{
          marginTop: '0.4rem',
          paddingLeft: '1.2rem',
          borderLeft: `2px solid ${color}22`,
          animation: 'fadeIn 0.2s ease'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Copy Button ────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        padding: '0.2rem 0.4rem',
        cursor: 'pointer',
        color: copied ? COLORS.green : COLORS.textMuted,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.7rem',
        transition: 'all 0.2s',
      }}
      title="Copy"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Code Block ─────────────────────────────────────────────────
function CodeBlock({ code, language, filename }: { code: string; language?: string; filename?: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      marginTop: '0.5rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0.75rem',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={12} color={COLORS.textMuted} />
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
            {filename || language || 'code'}
          </span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0,
        padding: '0.75rem',
        fontSize: '0.8rem',
        lineHeight: '1.6',
        color: '#a0aec0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        overflowX: 'auto',
        maxHeight: '300px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {code}
      </pre>
    </div>
  );
}

// ─── Pill / Tag ─────────────────────────────────────────────────
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.5rem',
      borderRadius: '999px',
      background: color + '18',
      color,
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.3px',
      border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  );
}

// ─── Rating Stars ───────────────────────────────────────────────
function RatingStars({ rating, max = 10 }: { rating: number; max?: number }) {
  const filled = Math.round((rating / max) * 5);
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < filled ? COLORS.yellow : 'transparent'} color={i < filled ? COLORS.yellow : COLORS.textDim} />
      ))}
      <span style={{ marginLeft: '0.35rem', fontSize: '0.8rem', color: COLORS.yellow, fontWeight: 700 }}>{rating}/10</span>
    </div>
  );
}

// ─── Message Content Renderers ──────────────────────────────────
function renderDecision(data: any) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>Next action →</span>
        <Pill text={data.action || 'unknown'} color={COLORS.purple} />
      </div>
      {data.reasoning && (
        <p style={{ color: COLORS.text, fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          {truncate(data.reasoning, 300)}
        </p>
      )}
      {data.actionHistory && data.actionHistory.length > 0 && (
        <Collapsible title={`Action History (${data.actionHistory.length})`} color={COLORS.purple}>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {data.actionHistory.map((a: string, i: number) => (
              <Pill key={i} text={a} color={COLORS.textMuted} />
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}

function renderPlan(data: any) {
  return (
    <div>
      {data.overallGoal && (
        <p style={{ color: COLORS.text, fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 0.75rem' }}>
          <span style={{ fontWeight: 600, color: COLORS.blue }}>Goal: </span>
          {truncate(data.overallGoal, 200)}
        </p>
      )}
      {data.steps && data.steps.length > 0 && (
        <div>
          <span style={{ fontSize: '0.8rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Steps ({data.steps.length})
          </span>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.steps.map((step: any, i: number) => (
              <div key={i} style={{
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <span style={{
                  flexShrink: 0,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: step.status === 'completed' ? COLORS.green + '30' : COLORS.blue + '20',
                  border: `1px solid ${step.status === 'completed' ? COLORS.green : COLORS.blue}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: step.status === 'completed' ? COLORS.green : COLORS.blue,
                }}>
                  {step.status === 'completed' ? '✓' : i + 1}
                </span>
                <span style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {truncate(step.description, 150)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderResearch(data: any) {
  return (
    <div>
      {data.architectureNotes && (
        <p style={{ color: COLORS.text, fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 0.5rem' }}>
          {truncate(data.architectureNotes, 250)}
        </p>
      )}
      {data.bestPractices && data.bestPractices.length > 0 && (
        <Collapsible title={`Best Practices (${data.bestPractices.length})`} defaultOpen color={COLORS.cyan}>
          <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'none' }}>
            {data.bestPractices.slice(0, 6).map((bp: string, i: number) => (
              <li key={i} style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.7, position: 'relative', paddingLeft: '0.75rem' }}>
                <span style={{ position: 'absolute', left: 0, color: COLORS.cyan }}>•</span>
                {truncate(bp, 120)}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
      {data.recommendations && data.recommendations.length > 0 && (
        <Collapsible title={`Recommendations (${data.recommendations.length})`} color={COLORS.cyan}>
          <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'none' }}>
            {data.recommendations.slice(0, 6).map((r: string, i: number) => (
              <li key={i} style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.7, position: 'relative', paddingLeft: '0.75rem' }}>
                <span style={{ position: 'absolute', left: 0, color: COLORS.cyan }}>•</span>
                {truncate(r, 120)}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  );
}

function renderCode(data: any) {
  return (
    <div>
      {data.explanation && (
        <p style={{
          color: COLORS.text,
          fontSize: '0.9rem',
          lineHeight: 1.7,
          margin: '0 0 0.75rem',
          padding: '0.6rem 0.8rem',
          background: 'rgba(72,187,120,0.06)',
          borderRadius: '6px',
          borderLeft: `3px solid ${COLORS.green}40`,
        }}>
          {truncate(data.explanation, 250)}
        </p>
      )}
      {data.files && data.files.length > 0 && (
        <div>
          <span style={{ fontSize: '0.8rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Files Generated ({data.files.length})
          </span>
          {data.files.map((file: any, i: number) => (
            <Collapsible key={i} title={file.filename || `file-${i + 1}`} defaultOpen={i === 0} color={COLORS.green}>
              <CodeBlock code={file.content} language={file.language} filename={file.filename} />
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}

function renderReview(data: any) {
  return (
    <div>
      {data.rating != null && (
        <div style={{ marginBottom: '0.75rem' }}>
          <RatingStars rating={data.rating} />
        </div>
      )}
      {data.shouldRevise != null && (
        <div style={{ marginBottom: '0.5rem' }}>
          <Pill text={data.shouldRevise ? 'Needs Revision' : 'Approved'} color={data.shouldRevise ? COLORS.orange : COLORS.green} />
        </div>
      )}
      {data.issues && data.issues.length > 0 && (
        <Collapsible title={`Issues (${data.issues.length})`} defaultOpen color={COLORS.red}>
          <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'none' }}>
            {data.issues.slice(0, 5).map((issue: string, i: number) => (
              <li key={i} style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.7, position: 'relative', paddingLeft: '0.75rem' }}>
                <span style={{ position: 'absolute', left: 0, color: COLORS.red }}>✗</span>
                {truncate(issue, 120)}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
      {data.improvements && data.improvements.length > 0 && (
        <Collapsible title={`Improvements (${data.improvements.length})`} color={COLORS.green}>
          <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'none' }}>
            {data.improvements.slice(0, 5).map((imp: string, i: number) => (
              <li key={i} style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.7, position: 'relative', paddingLeft: '0.75rem' }}>
                <span style={{ position: 'absolute', left: 0, color: COLORS.green }}>↑</span>
                {truncate(imp, 120)}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  );
}

function renderComplete(data: any) {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
      <p style={{ color: COLORS.green, fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
        Task Completed Successfully
      </p>
      <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0 }}>
        Finished in {data.iterations || '?'} iteration{(data.iterations || 0) !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function renderMaxIterations(_data: any) {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
      <p style={{ color: COLORS.orange, fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
        Maximum Iterations Reached
      </p>
      <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        The system hit the iteration limit. The task may be partially complete.
        You can increase <code style={{ color: COLORS.orange, background: 'rgba(246,173,85,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>MAX_ITERATIONS</code> in your <code style={{ color: COLORS.orange, background: 'rgba(246,173,85,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>.env</code> file.
      </p>
    </div>
  );
}

function renderError(data: any) {
  return (
    <div>
      <p style={{ color: COLORS.red, fontSize: '0.9rem', margin: 0 }}>
        {typeof data === 'string' ? data : data.message || JSON.stringify(data)}
      </p>
    </div>
  );
}

function renderStart(data: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>Task initiated:</span>
      <span style={{ color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>{truncate(data.userInput, 200)}</span>
    </div>
  );
}

function renderGeneric(data: any) {
  if (typeof data === 'string') {
    return <p style={{ color: COLORS.text, fontSize: '0.9rem', margin: 0, lineHeight: 1.7 }}>{truncate(data, 300)}</p>;
  }
  return (
    <Collapsible title="Details" defaultOpen color={COLORS.textMuted}>
      <pre style={{
        color: COLORS.textMuted,
        fontSize: '0.78rem',
        fontFamily: "'JetBrains Mono', monospace",
        margin: 0,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Collapsible>
  );
}

function renderMessageContent(type: string, data: any) {
  switch (type) {
    case 'decision':       return renderDecision(data);
    case 'plan':           return renderPlan(data);
    case 'research':       return renderResearch(data);
    case 'code':           return renderCode(data);
    case 'review':         return renderReview(data);
    case 'complete':       return renderComplete(data);
    case 'max_iterations': return renderMaxIterations(data);
    case 'error':          return renderError(data);
    case 'start':          return renderStart(data);
    case 'iteration':      return null; // handled inline
    default:               return renderGeneric(data);
  }
}

// ─── Main App ───────────────────────────────────────────────────
const App = () => {
  const [task, setTask] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentIteration, setCurrentIteration] = useState({ current: 0, max: 0 });
  const [activePhase, setActivePhase] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWs();
    return () => { wsRef.current?.close(); };
  }, []);

  function connectWs() {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => { setWsConnected(true); };
    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(connectWs, 3000);
    };
    ws.onerror = () => { setWsConnected(false); };

    ws.onmessage = (event) => {
      try {
        const msg: Message = JSON.parse(event.data);

        // Skip iteration messages from the card list, track progress instead
        if (msg.type === 'iteration') {
          setCurrentIteration({ current: msg.data.current, max: msg.data.max });
          setProgress(Math.round((msg.data.current / msg.data.max) * 90));
          return;
        }

        if (AGENT_STEPS.includes(msg.type)) {
          setActivePhase(msg.type);
        }

        if (msg.type === 'complete') {
          setProgress(100);
          setIsExecuting(false);
          setActivePhase('complete');
        }
        if (msg.type === 'max_iterations') {
          setProgress(100);
          setIsExecuting(false);
          setActivePhase('max_iterations');
        }
        if (msg.type === 'error') {
          setIsExecuting(false);
        }

        setMessages(prev => [...prev, msg]);
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 80);
      } catch (err) {
        console.error('WS parse error', err);
      }
    };
    wsRef.current = ws;
  }

  const handleStartTask = async () => {
    if (!task.trim() || isExecuting) return;
    setMessages([]);
    setIsExecuting(true);
    setProgress(2);
    setActivePhase('');
    setCurrentIteration({ current: 0, max: 0 });

    try {
      const res = await fetch(`${API_URL}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: task }),
      });
      if (!res.ok) throw new Error('Server returned ' + res.status);
    } catch (err: any) {
      setMessages([{ type: 'error', data: err.message, timestamp: new Date().toISOString() }]);
      setIsExecuting(false);
      setProgress(0);
    }
  };

  // ─── Render ─────────────────────────────────────────────────
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    background: COLORS.gradientBg,
    color: COLORS.text,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  };

  return (
    <div style={containerStyle}>
      {/* ── Floating particles (decorative) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(159,122,234,0.04)' : 'rgba(213,63,140,0.03)'} 0%, transparent 70%)`,
            left: `${(i * 17) % 80}%`,
            top: `${(i * 23) % 80}%`,
            animation: `float${i % 3} ${15 + i * 5}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>
        {/* ── Header ── */}
        <header style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: wsConnected ? COLORS.green : COLORS.red,
              boxShadow: `0 0 8px ${wsConnected ? COLORS.green : COLORS.red}80`,
              animation: wsConnected ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            background: COLORS.gradientPrimary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 0.5rem',
            letterSpacing: '-1px',
          }}>
            Multi-Agent Universe
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '1rem', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Describe a task and watch AI agents collaborate in real&nbsp;time
          </p>
        </header>

        {/* ── Input Card ── */}
        <div style={{
          background: COLORS.surface,
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Build a REST API for a todo app with authentication..."
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '10px',
              padding: '1rem 1.1rem',
              color: COLORS.text,
              fontSize: '0.95rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              transition: 'border 0.25s',
              minHeight: '80px',
            }}
            onFocus={(e) => { e.target.style.borderColor = COLORS.purple; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStartTask(); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: COLORS.textDim }}>
              Press Ctrl+Enter to start
            </span>
            <button
              onClick={handleStartTask}
              disabled={isExecuting || !task.trim()}
              style={{
                padding: '0.65rem 1.8rem',
                background: isExecuting || !task.trim() ? COLORS.textDim : COLORS.gradientPrimary,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: isExecuting || !task.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: isExecuting || !task.trim() ? 'none' : '0 4px 20px rgba(159,122,234,0.35)',
                opacity: isExecuting || !task.trim() ? 0.5 : 1,
              }}
            >
              {isExecuting ? (
                <>
                  <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Running…
                </>
              ) : (
                <><Play size={16} /> Start Task</>
              )}
            </button>
          </div>
        </div>

        {/* ── Pipeline Progress ── */}
        {(isExecuting || messages.length > 0) && (
          <div style={{
            background: COLORS.surface,
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}>
            {/* Progress Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={18} color={COLORS.purple} style={isExecuting ? { animation: 'spin 2s linear infinite' } : {}} />
                <h2 style={{ fontSize: '1.1rem', margin: 0, color: COLORS.text, fontWeight: 700 }}>Agent Pipeline</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {currentIteration.max > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} color={COLORS.textMuted} />
                    <span style={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
                      Iter {currentIteration.current}/{currentIteration.max}
                    </span>
                  </div>
                )}
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: progress >= 100 ? COLORS.green : COLORS.purple,
                }}>
                  {progress}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: progress >= 100
                  ? (activePhase === 'max_iterations' ? `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.yellow})` : `linear-gradient(90deg, ${COLORS.green}, ${COLORS.cyan})`)
                  : COLORS.gradientPrimary,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 12px ${COLORS.purple}60`,
              }} />
            </div>

            {/* Phase Indicators */}
            <div style={{
              padding: '0.75rem 1.5rem',
              display: 'flex',
              gap: '0.4rem',
              borderBottom: `1px solid ${COLORS.border}`,
              overflowX: 'auto',
            }}>
              {AGENT_STEPS.map(step => {
                const cfg = AGENT_CONFIG[step];
                const isActive = activePhase === step;
                const isPast = AGENT_STEPS.indexOf(activePhase) > AGENT_STEPS.indexOf(step);
                const Icon = cfg.icon;
                return (
                  <div key={step} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '8px',
                    background: isActive ? cfg.glow : isPast ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: `1px solid ${isActive ? cfg.color + '40' : 'transparent'}`,
                    transition: 'all 0.3s',
                    opacity: isPast ? 0.5 : isActive ? 1 : 0.35,
                  }}>
                    <Icon size={13} color={isActive ? cfg.color : COLORS.textMuted} />
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isActive ? cfg.color : COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                    }}>
                      {cfg.label}
                    </span>
                    {isPast && <Check size={11} color={COLORS.green} />}
                  </div>
                );
              })}
            </div>

            {/* Messages Feed */}
            <div
              ref={scrollContainerRef}
              style={{
                maxHeight: '600px',
                overflowY: 'auto',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {messages.map((msg, idx) => {
                const cfg = AGENT_CONFIG[msg.type] || AGENT_CONFIG.error;
                const Icon = cfg.icon;

                return (
                  <div
                    key={idx}
                    style={{
                      background: cfg.glow,
                      border: `1px solid ${cfg.color}18`,
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      animation: 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      transition: 'all 0.3s',
                    }}
                  >
                    {/* Card Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `${cfg.color}15`,
                          border: `1px solid ${cfg.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Icon size={14} color={cfg.color} />
                        </div>
                        <span style={{
                          color: cfg.color,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.7px',
                        }}>
                          {cfg.label}
                        </span>
                        <Pill text={msg.type} color={cfg.color} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: COLORS.textDim }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ paddingLeft: '0.15rem' }}>
                      {renderMessageContent(msg.type, msg.data)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float0 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, 25px); }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        textarea::placeholder { color: #4a5568; }

        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default App;