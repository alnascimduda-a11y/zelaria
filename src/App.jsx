import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Mic,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Play,
  ChevronRight,
  CheckCircle,
  Check,
  Trash2,
  Zap,
  Sparkles,
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ── Logo ──────────────────────────────────────────────────────────────────
function Logo({ hero = false }) {
  const textCls = hero ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-xl';
  const iconSize = hero ? 28 : 13;

  return (
    <span className={`font-black tracking-tight text-white ${textCls} select-none`}>
      zelar
      <span className="relative inline-block">
        {/* ı = dotless i (U+0131) */}
        ı
        <span
          className="absolute [&_path]:fill-violet-500 [&_path]:stroke-none"
          style={{ lineHeight: 0, top: '0.18em', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Sparkles size={iconSize} strokeWidth={0} />
        </span>
      </span>
      a
    </span>
  );
}

// ── Network / Teia animada (canvas) ───────────────────────────────────────
function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };

    resize();
    window.addEventListener('resize', resize);

    const COUNT = 95;
    const MAX_DIST = 160;

    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r:  Math.random() * 1.4 + 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      // conexões
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168,85,247,${(1 - d / MAX_DIST) * 0.28})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nós
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(168,85,247,0.7)';
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// ── Fade-in-view wrapper ──────────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 30, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── AudioWave ─────────────────────────────────────────────────────────────
function AudioWave() {
  const bars = [4, 7, 12, 8, 14, 6, 16, 9, 11, 6, 13, 7, 10, 15, 6, 8, 13, 5, 8, 11];
  return (
    <div className="flex items-center gap-[2.5px]">
      {bars.map((h, i) => (
        <div key={i} className="w-[3px] rounded-full bg-white/65" style={{ height: h }} />
      ))}
    </div>
  );
}

// ── Chat sub-components ───────────────────────────────────────────────────
function MessageWrapper({ side, showAvatar, children }) {
  return (
    <div className={`flex items-end gap-2 ${side === 'worker' ? 'flex-row-reverse' : ''}`}>
      {showAvatar ? (
        side === 'worker' ? (
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            JR
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
        )
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className={`flex flex-col gap-1 ${side === 'worker' ? 'items-end' : 'items-start'} max-w-[78%]`}>
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-1 items-center px-4 py-3 bg-slate-100 rounded-2xl rounded-tl-sm w-16">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ delay: i * 0.18, duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ResultBubble({ title, items, color }) {
  const styles = {
    emerald: { wrap: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', title: 'text-emerald-700', dot: 'bg-emerald-400' },
    blue:    { wrap: 'bg-blue-50 border-blue-200',       icon: 'text-blue-600',    title: 'text-blue-700',    dot: 'bg-blue-400'    },
  };
  const s = styles[color] || styles.emerald;
  return (
    <div className={`border rounded-2xl rounded-tl-sm p-4 shadow-sm ${s.wrap}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <CheckCircle className={`w-4 h-4 shrink-0 ${s.icon}`} />
        <p className={`text-sm font-bold ${s.title}`}>{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${s.dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertBubble({ title, msg }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm font-bold text-red-700">{title}</p>
      </div>
      <p className="text-xs text-red-600 leading-relaxed">{msg}</p>
    </div>
  );
}

function PhotoBubble({ caption, tag, src }) {
  return (
    <div className="rounded-2xl rounded-tr-sm overflow-hidden shadow-md max-w-[210px]">
      <div className="h-28 relative overflow-hidden bg-slate-200">
        <img src={src} alt={caption} className="w-full h-full object-cover" />
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold text-white bg-black/50 px-2 py-0.5 rounded uppercase tracking-widest">
          {tag}
        </span>
        <div className="absolute bottom-1.5 right-1.5 bg-black/40 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Camera className="w-2.5 h-2.5 text-white/80" />
          <p className="text-[8px] text-white/80 font-mono font-bold">FOTO</p>
        </div>
      </div>
      <div className="bg-violet-600 px-3 py-2">
        <p className="text-xs text-white font-medium">{caption}</p>
      </div>
    </div>
  );
}

function VoiceBubble({ duration, transcript }) {
  return (
    <div className="max-w-[270px]">
      <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-3 shadow-md">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Play className="w-3 h-3 ml-0.5" />
        </div>
        <AudioWave />
        <span className="text-xs text-white/65 shrink-0 font-mono">{duration}</span>
      </div>
      {transcript && (
        <p className="text-[11px] text-slate-500 italic mt-1.5 px-1 leading-relaxed">{transcript}</p>
      )}
    </div>
  );
}

// ── ChatPlatformDemo ──────────────────────────────────────────────────────
const CHAT_SCRIPT = [
  { type: 'label',  text: 'Segunda-feira, 09:12', pause: 200 },
  { type: 'audio',  side: 'worker', duration: '0:11',
    transcript: '"Troquei o mecanismo do ap. 301 e usei 1kg de barrilha e 500g de cloro na piscina."',
    pause: 900 },
  { type: 'typing', side: 'platform', pause: 2200 },
  { type: 'result', side: 'platform', color: 'emerald', title: 'OS #4821 — Gerada ✓',
    items: [
      'Mecanismo duplo acionamento (1un) → debitado',
      'Barrilha 1kg → debitado do estoque',
      'Cloro granulado 500g → debitado',
      'Custo: R$ 347,00 atribuído · Bloco A + Piscina',
    ],
    pause: 3800 },
  { type: 'label',  text: 'Segunda-feira, 09:21', pause: 250 },
  { type: 'photo',  side: 'worker', caption: 'Hidrômetro · Ap. 317 · Bloco C', tag: 'MEDIÇÃO',
    src: '/Hidrômetro · Bloco C.webp',
    pause: 900 },
  { type: 'typing', side: 'platform', pause: 1900 },
  { type: 'alert',  side: 'platform', title: 'OCR: 0003432 m³ — Ap. 317 · Bloco C',
    msg: 'Consumo 280% acima da média dos demais apartamentos do bloco. Possível vazamento interno. Síndico e zelador notificados automaticamente.',
    pause: 3800 },
  { type: 'label',  text: 'Segunda-feira, 11:42', pause: 250 },
  { type: 'photo',  side: 'worker', caption: 'Hall B — Limpeza Concluída', tag: 'SLA',
    src: '/Hall B — Limpeza Concluída.jpg',
    pause: 900 },
  { type: 'typing', side: 'platform', pause: 1700 },
  { type: 'result', side: 'platform', color: 'blue', title: 'SLA Registrado ✓',
    items: [
      'Ronda Hall B confirmada às 11:42',
      'Foto registrada como evidência',
      'Prestador: Limpeza Total · auditado',
    ],
    pause: 5200 },
  { type: '__reset__', pause: 600 },
];

function ChatPlatformDemo() {
  const [messages, setMessages] = useState([]);
  const chatRef  = useRef(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    let idx = 0;
    let timerId;
    const cycle = ++cycleRef.current;

    const advance = () => {
      if (cycleRef.current !== cycle) return;
      const item = CHAT_SCRIPT[idx];

      if (item.type === '__reset__') {
        idx = 0;
        setMessages([]);
      } else {
        const uid = `${item.type}-${idx}-${Date.now()}`;
        setMessages((prev) => {
          const base =
            item.type !== 'typing' && item.side === 'platform'
              ? prev.filter((m) => m.type !== 'typing')
              : prev;
          return [...base, { ...item, uid }];
        });
        idx++;
        if (idx >= CHAT_SCRIPT.length) idx = 0;
      }
      timerId = setTimeout(advance, item.pause);
    };

    timerId = setTimeout(advance, 600);
    return () => {
      clearTimeout(timerId);
      cycleRef.current++;
    };
  }, []);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">zelaria · Canal de Campo</p>
          <p className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            3 técnicos online · IA processando
          </p>
        </div>
        <div className="ml-auto hidden sm:block text-right">
          <p className="text-xs font-semibold text-slate-600">Edifício São Paulo</p>
          <p className="text-[11px] text-slate-400 font-mono">180 unidades</p>
        </div>
      </div>

      {/* Chat feed */}
      <div ref={chatRef} className="h-[460px] overflow-y-auto px-4 py-5 flex flex-col gap-4 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg, i, arr) => {
            if (msg.type === 'label') {
              return (
                <motion.div
                  key={msg.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }
            const prevSameSide =
              i > 0 && arr[i - 1].side === msg.side && arr[i - 1].type !== 'label';
            return (
              <motion.div
                key={msg.uid}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <MessageWrapper side={msg.side} showAvatar={!prevSameSide}>
                  {msg.type === 'typing' && <TypingBubble />}
                  {msg.type === 'audio'  && <VoiceBubble duration={msg.duration} transcript={msg.transcript} />}
                  {msg.type === 'photo'  && <PhotoBubble caption={msg.caption} tag={msg.tag} src={msg.src} />}
                  {msg.type === 'result' && <ResultBubble title={msg.title} items={msg.items} color={msg.color} />}
                  {msg.type === 'alert'  && <AlertBubble title={msg.title} msg={msg.msg} />}
                </MessageWrapper>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center gap-3">
        <div className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs text-slate-400 select-none">
          O técnico envia foto ou áudio — a IA cuida do resto...
        </div>
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
          <Mic className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── PillarCard ────────────────────────────────────────────────────────────
function PillarCard({ icon: Icon, title, subtitle, desc, colorA, delay }) {
  return (
    <FadeIn delay={delay}>
      <div
        className="relative rounded-xl p-px overflow-hidden h-full"
        style={{ background: `linear-gradient(135deg, ${colorA}35, transparent 70%)` }}
      >
        <div className="bg-zinc-950/95 rounded-[11px] p-6 h-full flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg shrink-0"
              style={{ background: `${colorA}15`, border: `1px solid ${colorA}30` }}
            >
              <Icon className="w-5 h-5" style={{ color: colorA }} />
            </div>
            <div>
              <p
                className="text-xs font-mono font-bold uppercase tracking-widest"
                style={{ color: colorA }}
              >
                {subtitle}
              </p>
              <h3 className="text-sm font-bold text-white leading-snug">{title}</h3>
            </div>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed flex-1">{desc}</p>
        </div>
      </div>
    </FadeIn>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────
function DonutChart() {
  const r = 44; const cx = 56; const cy = 56;
  const C = 2 * Math.PI * r;
  const data = [
    { label: 'Manutenção', pct: 38, color: '#a855f7' },
    { label: 'Limpeza',    pct: 27, color: '#3b82f6' },
    { label: 'Utilities',  pct: 21, color: '#10b981' },
    { label: 'Compliance', pct: 14, color: '#f59e0b' },
  ];
  let cumLen = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={112} height={112} viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {data.map((d, i) => {
          const len = (d.pct / 100) * C;
          const off = -cumLen;
          cumLen += len;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={18}
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={off}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">Despesas</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b" fontFamily="monospace">4 cat.</text>
      </svg>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="flex-1">{d.label}</span>
            <span className="font-bold text-slate-700">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── BarChart ──────────────────────────────────────────────────────────────
function BarChart() {
  const months = [
    { m: 'Mar', v: 420, after: false },
    { m: 'Abr', v: 445, after: false },
    { m: 'Mai', v: 398, after: false },
    { m: 'Jun', v: 310, after: true, mark: true },
    { m: 'Jul', v: 267, after: true },
    { m: 'Ago', v: 241, after: true },
  ];
  const max = 480;
  return (
    <div className="flex items-end gap-1.5 h-[96px]">
      {months.map((m, i) => {
        const hPct = (m.v / max) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end relative">
            {m.mark && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[7px] font-bold text-violet-500 whitespace-nowrap bg-violet-50 border border-violet-200 px-1 py-px rounded">
                IA ↓
              </span>
            )}
            <div
              className={`w-full rounded-t-md ${m.after ? 'bg-violet-500' : 'bg-slate-200'}`}
              style={{ height: `${hPct}%` }}
            />
            <p className="text-[8px] text-slate-400 font-mono leading-none">{m.m}</p>
            <p className={`text-[7px] font-bold leading-none ${m.after ? 'text-violet-500' : 'text-slate-400'}`}>{m.v}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── DashboardMockup ───────────────────────────────────────────────────────
function DashboardMockup() {
  const NAV = [
    { icon: Eye,         label: 'Visão Geral',   active: true  },
    { icon: Zap,         label: 'Financeiro',    active: false },
    { icon: Mic,         label: 'Manutenção',    active: false },
    { icon: QrCode,      label: 'Limpeza · SLA', active: false },
    { icon: ShieldCheck, label: 'Compliance',    active: false },
  ];

  const EVENTS = [
    { area: 'Piscina · Bloco A',    type: 'Produto Químico', cost: 'R$ 280',   status: 'Baixado',  ok: true  },
    { area: 'Hidrômetro · Ap. 317', type: 'Leitura OCR',     cost: '—',         status: 'Alerta',   ok: false },
    { area: 'Hall B — Limpeza',     type: 'SLA Confirmado',  cost: '—',         status: 'OK',       ok: true  },
    { area: 'Extintor · Garagem',   type: 'Compliance',      cost: 'R$ 180',   status: 'Vencendo', ok: false },
    { area: 'Hidráulica · Ap. 301', type: 'Manutenção Voz',  cost: 'R$ 1.240', status: 'OS Gerada',ok: true  },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      {/* Topbar */}
      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-slate-100">
        <span className="w-3 h-3 rounded-full bg-red-400/70" />
        <span className="w-3 h-3 rounded-full bg-amber-400/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
        <span className="ml-4 text-xs font-mono text-slate-400">
          zelaria platform — Visão Geral · Agosto 2026
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-500 font-bold">AO VIVO</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-slate-100 p-4 flex flex-col gap-1 bg-slate-50/60 min-h-[500px]">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono px-2">
            Edifício São Paulo
          </p>
          {NAV.map((item, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs cursor-default transition-colors ${
              item.active ? 'bg-violet-600 text-white' : 'text-slate-500'
            }`}>
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}

          {/* Economia card */}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="px-3 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Economia gerada</p>
              <p className="text-lg font-black text-emerald-600 font-mono leading-none">R$ 12.840</p>
              <p className="text-[9px] text-emerald-500 mt-0.5">vs. mesmo período s/ IA</p>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Economia Gerada',  value: 'R$ 12.840', delta: '+18% vs ant.', color: 'text-emerald-500' },
              { label: 'SLA Cumprido',     value: '94,2%',     delta: '+5 pts',        color: 'text-blue-500'   },
              { label: 'OS Fechadas',      value: '47',        delta: 'este mês',      color: 'text-violet-500' },
              { label: 'Alertas Ativos',   value: '2',         delta: '↓ 3 sem ant.', color: 'text-amber-500'  },
            ].map((m, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-[10px] text-slate-500 mb-1.5 truncate">{m.label}</p>
                <p className="text-xl font-black text-slate-900 font-mono leading-none mb-1">{m.value}</p>
                <p className={`text-[10px] font-bold ${m.color}`}>{m.delta}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="flex gap-4 min-w-0">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">Consumo Hídrico (m³)</p>
                  <p className="text-[10px] text-slate-400 font-mono">Últimos 6 meses</p>
                </div>
                <span className="text-[9px] bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full border border-violet-200 shrink-0">
                  −43% após IA
                </span>
              </div>
              <BarChart />
            </div>
            <div className="w-48 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4 hidden sm:block">
              <p className="text-xs font-bold text-slate-700 mb-0.5">Despesas</p>
              <p className="text-[10px] text-slate-400 font-mono mb-3">Por categoria</p>
              <DonutChart />
            </div>
          </div>

          {/* Events */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">
              Eventos Recentes — Tempo Real
            </p>
            <div className="space-y-1.5">
              {EVENTS.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-white px-4 py-2.5 rounded-lg border border-slate-200">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="text-slate-700 font-medium w-36 truncate">{e.area}</span>
                  <span className="text-slate-400 flex-1 truncate">{e.type}</span>
                  <span className="text-slate-500 font-mono w-16 text-right shrink-0">{e.cost}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    e.ok
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ChatForm ──────────────────────────────────────────────────────────────
const FORM_QUESTIONS = [
  {
    key: 'nome',
    ask: () => 'Para começar — qual é o seu nome completo?',
    placeholder: 'Seu nome completo',
    type: 'text',
  },
  {
    key: 'condominio',
    ask: (a) => `Prazer, ${a.nome?.split(' ')[0] || 'você'}! Qual é o nome do condomínio ou administradora?`,
    placeholder: 'Ex: Condomínio Solar das Flores',
    type: 'text',
  },
  {
    key: 'cep',
    ask: () => 'Qual o CEP do condomínio?',
    placeholder: '00000-000',
    type: 'text',
  },
  {
    key: 'foto_fachada',
    ask: () => 'Quer adicionar uma foto da fachada do condomínio?',
    type: 'photo-optional',
  },
  {
    key: 'apartamentos',
    ask: () => 'Quantos apartamentos tem o condomínio?',
    placeholder: 'Ex: 120',
    type: 'text',
  },
  {
    key: 'telefone',
    ask: () => 'Qual é o seu telefone? (WhatsApp preferível)',
    placeholder: '(11) 99999-9999',
    type: 'text',
  },
  {
    key: 'email',
    ask: () => 'E o seu e-mail de contato?',
    placeholder: 'voce@email.com.br',
    type: 'email',
  },
  {
    key: 'dor',
    ask: () => 'Última pergunta: qual é a sua maior dor operacional hoje? Me conta com suas palavras — ou manda um áudio 🎙️',
    placeholder: 'Escreva ou mande um áudio...',
    type: 'text',
  },
];

function ChatForm() {
  const [msgs,       setMsgs]       = useState([]);
  const [step,       setStep]       = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [inputVal,   setInputVal]   = useState('');
  const [aiTyping,   setAiTyping]   = useState(false);
  const [listening,  setListening]  = useState(false);
  const [recSecs,    setRecSecs]    = useState(0);
  const [pendingImg, setPendingImg] = useState(null);
  const [done,       setDone]       = useState(false);
  const chatRef      = useRef(null);
  const fileRef      = useRef(null);
  const bootedRef    = useRef(false);
  const submittingRef = useRef(false);
  const recRef       = useRef(null);

  const uid    = () => `${Date.now()}-${Math.random()}`;
  const addMsg = (m) => setMsgs((p) => [...p, { ...m, uid: uid() }]);

  // timer de gravação
  useEffect(() => {
    if (!listening) { setRecSecs(0); return; }
    const id = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  const askStep = (idx, prevAnswers) => {
    if (idx >= FORM_QUESTIONS.length) return;
    submittingRef.current = false; // libera para próxima resposta
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      const q    = FORM_QUESTIONS[idx];
      const text = typeof q.ask === 'function' ? q.ask(prevAnswers) : q.ask;
      addMsg({ side: 'ai', type: 'text', text });
      if (q.type === 'select') {
        setTimeout(() => addMsg({ side: 'ai', type: 'options', options: q.options, qIdx: idx }), 350);
      }
    }, 850);
  };

  // Boot once
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      addMsg({ side: 'ai', type: 'text', text: 'Olá! 👋 A Zelaria está selecionando os primeiros condomínios para o nosso piloto exclusivo. As vagas são bem limitadas.' });
      setTimeout(() => askStep(0, {}), 600);
    }, 800);
  }, []);

  // Auto-scroll — na mensagem de sucesso recua um pouco para mostrar a resposta do usuário
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const last = msgs[msgs.length - 1];
    if (last?.type === 'success') {
      el.scrollTop = el.scrollHeight - el.clientHeight - 80;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [msgs, aiTyping]);

  const handleAnswer = async (value, msgType = 'text') => {
    if (done || submittingRef.current) return;
    submittingRef.current = true;
    const q = FORM_QUESTIONS[step];

    if (pendingImg) {
      addMsg({ side: 'user', type: 'image', src: pendingImg.src, caption: 'Foto do condomínio', tag: 'CONDOMÍNIO' });
      // guarda o File para upload posterior
      setAnswers(prev => ({ ...prev, __imgFile: pendingImg.file }));
      setPendingImg(null);
    }
    if (value) addMsg({ side: 'user', type: msgType, text: value });
    setInputVal('');

    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);

    // ── lookup de CEP via ViaCEP ────────────────────────────────────────
    if (q.key === 'cep') {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 8) {
        setAiTyping(true);
        try {
          const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
          const data = await res.json();
          if (!data.erro) {
            const endereco = `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro} — ${data.localidade}/${data.uf}`;
            addMsg({ side: 'ai', type: 'text', text: `📍 ${endereco}` });
          }
        } catch (_) {}
        setAiTyping(false);
      }
    }

    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep >= FORM_QUESTIONS.length) {
      setAiTyping(true);
      setTimeout(async () => {
        try {
          // upload da foto do prédio para Supabase Storage
          let imagem_condominio_url = '';
          const imgFile = newAnswers.__imgFile;
          if (imgFile) {
            const ext  = imgFile.name.split('.').pop();
            const path = `condominios/${Date.now()}.${ext}`;
            const { data: upData, error: upErr } = await supabase.storage
              .from('condominios')
              .upload(path, imgFile, { upsert: false });
            if (!upErr && upData) {
              const { data: urlData } = supabase.storage.from('condominios').getPublicUrl(upData.path);
              imagem_condominio_url = urlData?.publicUrl || '';
            }
          }

          await supabase.from('zelaria_beta_leads').insert([{
            nome:              newAnswers.nome         || '',
            email:             newAnswers.email        || '',
            empresa:           newAnswers.condominio   || '',
            dor_relatada:      newAnswers.dor          || '',
            cep:               newAnswers.cep          || '',
            condominio:        newAnswers.condominio   || '',
            apartamentos:      newAnswers.apartamentos || '',
            telefone:          newAnswers.telefone     || '',
            imagem_condominio_url,
          }]);

          // dispara os e-mails via Cloudflare Worker (não bloqueia o UX)
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome:             newAnswers.nome         || '',
              email:            newAnswers.email        || '',
              condominio:       newAnswers.condominio   || '',
              cep:              newAnswers.cep          || '',
              apartamentos:     newAnswers.apartamentos || '',
              telefone:         newAnswers.telefone     || '',
              dor:              newAnswers.dor          || '',
              imagem_condominio_url,
            }),
          }).catch(() => {}); // silencia erros — não afeta o lead
        } catch (_) {}
        setAiTyping(false);
        if (typeof window.gtag_report_conversion === 'function') window.gtag_report_conversion();
        addMsg({ side: 'ai', type: 'success', firstName: newAnswers.nome?.split(' ')[0] || '' });
        setDone(true);
      }, 1200);
    } else {
      askStep(nextStep, newAnswers);
    }
  };

  const handleSend = () => {
    const val = inputVal.trim();
    if (!val && !pendingImg) return;
    handleAnswer(val);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      recRef.current = null;
      setListening(false);
      setInputVal(transcript);
      setTimeout(() => handleAnswer(transcript, 'audio'), 500);
    };
    rec.onend   = () => { recRef.current = null; setListening(false); };
    rec.onerror = () => { recRef.current = null; setListening(false); };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopVoice = () => {
    // Encerra a gravação — onresult dispara com o que foi capturado
    if (recRef.current) recRef.current.stop();
  };

  const cancelVoice = () => {
    if (recRef.current) {
      recRef.current.onresult = null; // impede envio automático
      recRef.current.stop();
      recRef.current = null;
    }
    setListening(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImg({ src: reader.result, file });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const currentQ = step < FORM_QUESTIONS.length ? FORM_QUESTIONS[step] : null;
  const isSelect = currentQ?.type === 'select';

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">zelaria · Lista de Interesse</p>
          <p className="text-xs font-medium text-violet-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            Piloto exclusivo · Vagas limitadas
          </p>
        </div>
        {!done && (
          <span className="ml-auto text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
            {Math.min(step + 1, FORM_QUESTIONS.length)}/{FORM_QUESTIONS.length}
          </span>
        )}
      </div>

      {/* Chat feed */}
      <div ref={chatRef} className="h-[460px] overflow-y-auto px-4 py-5 flex flex-col gap-3 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {msgs.map((msg) => (
            <motion.div
              key={msg.uid}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26 }}
            >
              {/* AI text */}
              {msg.side === 'ai' && msg.type === 'text' && (
                <div className="flex items-end gap-2 max-w-[88%]">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              )}

              {/* AI options */}
              {msg.side === 'ai' && msg.type === 'options' && (
                <div className="pl-9 flex flex-col gap-2 max-w-[88%]">
                  {msg.options.map((opt, i) => {
                    const qKey      = FORM_QUESTIONS[msg.qIdx]?.key;
                    const answered  = !!answers[qKey];
                    const selected  = answers[qKey] === opt;
                    return (
                      <button key={i} disabled={answered} onClick={() => handleAnswer(opt)}
                        className={`text-left text-sm px-4 py-2.5 rounded-xl border transition-colors ${
                          selected  ? 'bg-violet-600 text-white border-violet-600' :
                          answered  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default' :
                          'bg-white text-slate-700 border-slate-200 hover:border-violet-400 hover:bg-violet-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* AI success */}
              {msg.side === 'ai' && msg.type === 'success' && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-violet-600 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm max-w-[88%]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-white shrink-0" />
                      <p className="text-sm font-bold text-white">
                        {msg.firstName ? `Maravilha, ${msg.firstName}!` : 'Maravilha!'}
                      </p>
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed">
                      A partir de agora você faz parte do ecossistema Zelaria. Em breve teremos novidades — você será o primeiro a saber.
                    </p>
                  </div>
                </div>
              )}

              {/* User text */}
              {msg.side === 'user' && msg.type === 'text' && (
                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    EU
                  </div>
                  <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[75%]">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              )}

              {/* User audio */}
              {msg.side === 'user' && msg.type === 'audio' && (
                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    EU
                  </div>
                  <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[75%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Mic className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wide">Áudio transcrito</span>
                    </div>
                    <p className="text-sm leading-relaxed italic">{msg.text}</p>
                  </div>
                </div>
              )}

              {/* User image */}
              {msg.side === 'user' && msg.type === 'image' && (
                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    EU
                  </div>
                  <PhotoBubble caption={msg.caption} tag={msg.tag} src={msg.src} />
                </div>
              )}
            </motion.div>
          ))}

          {aiTyping && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <TypingBubble />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      {!done && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          {pendingImg && (
            <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl">
              <img src={pendingImg.src} className="w-9 h-9 rounded-lg object-cover" alt="" />
              <p className="text-xs text-violet-700 flex-1 font-medium">Foto pronta para enviar</p>
              <button onClick={() => setPendingImg(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
          )}
          {currentQ?.type === 'photo-optional' && !pendingImg ? (
            /* ── Sim / Não ──────────────────────────────────────────────── */
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
              >
                <Camera className="w-4 h-4" /> Sim, adicionar foto
              </button>
              <button
                onClick={() => handleAnswer('não')}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Agora não →
              </button>
            </div>
          ) : currentQ?.type === 'photo-optional' && pendingImg ? (
            /* ── Foto selecionada — confirmar ───────────────────────────── */
            <button
              onClick={handleSend}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" /> Enviar foto
            </button>
          ) : listening ? (
            /* ── Gravando — estilo WhatsApp ─────────────────────────────── */
            <div className="flex items-center gap-2">
              {/* Cancelar */}
              <button
                onClick={cancelVoice}
                className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500 hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {/* Waveform + timer */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                <div className="flex-1 flex items-end gap-0.5 h-5">
                  {[3,6,10,7,14,9,12,5,8,4,11,6].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-violet-500 rounded-full origin-bottom"
                      style={{
                        height: `${h}px`,
                        animation: 'waveBar 0.5s ease-in-out infinite alternate',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-slate-500 shrink-0 tabular-nums">
                  {`${Math.floor(recSecs / 60)}:${String(recSecs % 60).padStart(2, '0')}`}
                </span>
              </div>
              {/* Enviar */}
              <button
                onClick={stopVoice}
                className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center shrink-0 text-white hover:bg-violet-500 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-100 rounded-full px-4">
                <input
                  type={currentQ?.type === 'email' ? 'email' : 'text'}
                  className="flex-1 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  placeholder={currentQ?.placeholder || 'Digite...'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
              </div>
              {step === FORM_QUESTIONS.length - 1 && (
                <button onClick={startVoice}
                  className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center shrink-0 transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleSend}
                disabled={!inputVal.trim() && !pendingImg}
                className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white disabled:opacity-35 hover:bg-violet-500 transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: Eye,
    title: 'Medidores & Utilities',
    subtitle: 'Visão Computacional',
    desc: 'O zelador fotografa o hidrômetro. A IA lê os números via OCR, registra no sistema, compara com a média histórica e alerta sobre vazamentos na mesma hora.',
    colorA: '#d946ef',
  },
  {
    icon: Mic,
    title: 'Manutenção por Voz',
    subtitle: 'Processamento de Linguagem Natural',
    desc: 'O técnico relata o conserto por áudio. A IA transcreve, debita a peça do estoque e gera o custo da OS automaticamente. Zero digitação.',
    colorA: '#a855f7',
  },
  {
    icon: QrCode,
    title: 'Auditoria de Limpeza',
    subtitle: 'QR Code + Prova Visual',
    desc: 'QR Codes fixados nas áreas comuns. O terceirizado bipa e registra foto do ambiente. A plataforma gera o relatório de SLA sem margem para fraude.',
    colorA: '#a855f7',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Automático',
    subtitle: 'Motor de Regras de Negócio',
    desc: "A IA cruza datas de AVCB, seguro, extintores e caixas d'água. Notifica antes do vencimento e trava a operação até as regularizações serem concluídas.",
    colorA: '#d946ef',
  },
];

const DOR_OPTIONS = [
  { value: '',                                  label: 'Selecione sua maior dor...' },
  { value: 'Conta de Água/Luz sem controle',    label: 'Conta de Água/Luz sem controle' },
  { value: 'Manutenção desorganizada',           label: 'Manutenção desorganizada' },
  { value: 'Falha em equipes de limpeza',        label: 'Falha em equipes de limpeza' },
  { value: 'Risco de Compliance/Vencimentos',    label: 'Risco de Compliance/Vencimentos' },
];

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState({ nome: '', email: '', empresa: '', dor_relatada: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const { error } = await supabase.from('zelaria_beta_leads').insert([form]);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('success');
    }
  };

  const inputCls =
    'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm ' +
    'placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 ' +
    'focus:ring-1 focus:ring-purple-500/30 transition-colors';

  // ── Tela de sucesso ────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-lg"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Controle assumido.</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Nossa equipe entrará em contato. Prepare-se para ver sua operação condominial
            com clareza total.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <a
            href="#form"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
          >
            Auditar com IA
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Teia de tecnologia animada */}
        <NetworkBackground />
        {/* Glow central suave sobre a teia */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        {/* Fade radial nas bordas para não cortar bruto */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, #09090b 100%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/8 text-purple-300 text-xs font-bold uppercase tracking-widest mb-8 font-mono">
              <Zap className="w-3 h-3" />
              Plataforma de Inteligência Condominial — IA
            </div>

            <div className="mb-6">
              <Logo hero />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight">
              A sua operação condominial é uma{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                caixa preta de despesas
              </span>{' '}
              e riscos jurídicos?
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-zinc-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Zelaria é a malha de{' '}
              <strong className="text-white">Inteligência Artificial</strong>{' '}
              que blinda a sua operação condominial. Substituímos planilhas cegas por uma
              auditoria autônoma que roda{' '}
              <strong className="text-white">24/7</strong>: da medição de concessionárias
              ao compliance, do estoque à ronda de limpeza.{' '}
              <strong className="text-fuchsia-400">
                Zero margem para erro humano, zero vazamento de caixa.
              </strong>
            </p>

            <motion.a
              href="#form"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(147,51,234,0.3)',
                  '0 0 45px rgba(147,51,234,0.65)',
                  '0 0 20px rgba(147,51,234,0.3)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-base sm:text-lg transition-colors"
            >
              <Zap className="w-5 h-5" />
              Auditar Minha Gestão com IA
            </motion.a>

          </motion.div>
        </div>
      </section>

      {/* ══ PLATAFORMA — CHAT ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4 font-mono">
              Canal de Campo · IA
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Seu técnico fala.{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                A plataforma cuida do resto.
              </span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Foto ou áudio — a Zelaria transcreve, debita estoque, gera OS e registra SLA.
              Zero digitação. Zero retrabalho.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <ChatPlatformDemo />
          </FadeIn>
        </div>
      </section>

      {/* ══ MALHA DE IA ═════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-zinc-800/40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <FadeIn className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-4 font-mono">
              Arquitetura de IA
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Uma plataforma.{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Inteligência total
              </span>{' '}
              sobre cada metro quadrado.
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Quatro pilares interligados por IA que transformam dados caóticos em
              governança implacável.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-5">
            {PILLARS.map((p, i) => (
              <PillarCard key={i} {...p} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ DASHBOARD ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-bold uppercase tracking-widest mb-4 font-mono">
              Dashboard & DRE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Tudo visível.{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Nada fora do controle.
              </span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Métricas, gráficos, economia gerada e eventos em tempo real — sem planilha,
              sem retrabalho, pronto para a assembleia.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <DashboardMockup />
          </FadeIn>
        </div>
      </section>

      {/* ══ LISTA DE INTERESSE ══════════════════════════════════════════════ */}
      <section id="form" className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4 font-mono">
              Acesso Antecipado · Piloto 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-snug">
              Vagas limitadas.{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Seja um dos primeiros.
              </span>
            </h2>
            <p className="text-zinc-500">
              Estamos validando a Zelaria com os primeiros condomínios. Reserve sua vaga antes do lançamento.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <ChatForm />
          </FadeIn>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-zinc-800/40 bg-zinc-950 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-zinc-600 text-sm font-mono">
            © 2026 Zelaria. Um produto{' '}
            <span className="text-zinc-500">Criai Tecnologia Ltda.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
