import React from "react";

/** Injects all game-mode CSS keyframes + utility classes into the page. */
export const GameAnimations: React.FC = () => (
  <style>{`
    /* ── Streak punch-in ─────────────────────────────── */
    @keyframes streak-punch {
      0%   { transform: scale(1.8); opacity: 0; }
      40%  { transform: scale(0.9); opacity: 1; }
      60%  { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .animate-streak-punch {
      animation: streak-punch 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* ── Streak pulse (idle glow) ────────────────────── */
    @keyframes streak-pulse {
      0%, 100% { transform: scale(1); filter: brightness(1); }
      50%      { transform: scale(1.05); filter: brightness(1.3); }
    }
    .animate-streak-pulse {
      animation: streak-pulse 2.5s ease-in-out infinite;
    }

    /* ── Streak shatter ──────────────────────────────── */
    @keyframes streak-shatter {
      0%   { transform: scale(1); opacity: 1; filter: blur(0); }
      20%  { transform: scale(1.15) rotate(-2deg); }
      50%  { transform: scale(0.85) rotate(3deg); opacity: 0.7; }
      70%  { transform: scale(1.3); opacity: 0.3; filter: blur(2px); }
      100% { transform: scale(0.6); opacity: 0; filter: blur(6px); }
    }
    .animate-streak-shatter {
      animation: streak-shatter 0.6s ease-out forwards;
    }

    /* ── Screen-shake ────────────────────────────────── */
    @keyframes screen-shake {
      0%, 100% { transform: translateX(0); }
      10%  { transform: translateX(-6px) translateY(2px); }
      20%  { transform: translateX(5px) translateY(-3px); }
      30%  { transform: translateX(-4px) translateY(1px); }
      40%  { transform: translateX(3px) translateY(-1px); }
      50%  { transform: translateX(-2px); }
      60%  { transform: translateX(1px); }
    }
    .animate-screen-shake {
      animation: screen-shake 0.5s ease-out;
    }

    /* ── Combo text slam ─────────────────────────────── */
    @keyframes combo-slam {
      0%   { transform: scale(3) rotate(-8deg); opacity: 0; }
      30%  { transform: scale(0.9) rotate(2deg); opacity: 1; }
      50%  { transform: scale(1.1) rotate(-1deg); }
      70%  { transform: scale(1); }
      100% { transform: scale(1); opacity: 0; }
    }
    .animate-combo-slam {
      animation: combo-slam 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* ── Green energy burst (correct) ────────────────── */
    @keyframes energy-burst-correct {
      0%   { transform: scale(0); opacity: 1; }
      50%  { opacity: 0.6; }
      100% { transform: scale(3); opacity: 0; }
    }
    .energy-burst-correct::after {
      content: '';
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%);
      animation: energy-burst-correct 0.7s ease-out forwards;
      pointer-events: none;
    }

    /* ── Red shockwave (incorrect) ───────────────────── */
    @keyframes shockwave-red {
      0%   { transform: scale(0); opacity: 0.8; border-width: 4px; }
      100% { transform: scale(4); opacity: 0; border-width: 0; }
    }
    .shockwave-red::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 4px solid rgba(239,68,68,0.6);
      animation: shockwave-red 0.8s ease-out forwards;
      pointer-events: none;
    }

    /* ── Glow pulse for game toggle ──────────────────── */
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 8px rgba(139,92,246,0.4), 0 0 20px rgba(139,92,246,0.15); }
      50%      { box-shadow: 0 0 16px rgba(139,92,246,0.7), 0 0 40px rgba(139,92,246,0.3); }
    }
    .animate-glow-pulse {
      animation: glow-pulse 2s ease-in-out infinite;
    }

    /* ── Particle float (sparkles) ───────────────────── */
    @keyframes particle-float {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
      100% { transform: translateY(-80px) translateX(var(--px, 20px)) scale(0); opacity: 0; }
    }
    .game-particle {
      animation: particle-float var(--duration, 1s) ease-out forwards;
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    /* ── Fire flicker (tier effect) ──────────────────── */
    @keyframes fire-flicker {
      0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
      25%  { transform: scaleY(1.15) scaleX(0.9); opacity: 1; }
      50%  { transform: scaleY(0.9) scaleX(1.1); opacity: 0.7; }
      75%  { transform: scaleY(1.1) scaleX(0.95); opacity: 0.9; }
    }
    .animate-fire-flicker {
      animation: fire-flicker 0.4s ease-in-out infinite;
    }

    /* ── Tier backgrounds ────────────────────────────── */
    .tier-none {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    }
    .tier-onFire {
      background: linear-gradient(135deg, #451a03 0%, #1c1917 50%, #78350f 100%);
    }
    .tier-blazing {
      background: linear-gradient(135deg, #172554 0%, #0c0a3e 50%, #1e3a5f 100%);
    }
    .tier-unstoppable {
      background: linear-gradient(135deg, #2e1065 0%, #1a0533 50%, #581c87 100%);
    }
    .tier-legendary {
      background: linear-gradient(135deg, #422006 0%, #1a1a00 50%, #854d0e 100%);
    }
    .tier-transcendent {
      background: linear-gradient(135deg,
        hsl(280,80%,15%) 0%,
        hsl(320,60%,10%) 25%,
        hsl(200,80%,12%) 50%,
        hsl(160,60%,10%) 75%,
        hsl(280,80%,15%) 100%);
      background-size: 400% 400%;
      animation: prismatic-shift 4s ease-in-out infinite;
    }
    @keyframes prismatic-shift {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }

    /* ── Tier border glows ───────────────────────────── */
    .tier-border-none     { border-color: rgba(99,102,241,0.2); }
    .tier-border-onFire   { border-color: rgba(251,146,60,0.5); box-shadow: 0 0 20px rgba(251,146,60,0.15); }
    .tier-border-blazing  { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 20px rgba(59,130,246,0.15), inset 0 0 30px rgba(59,130,246,0.05); }
    .tier-border-unstoppable { border-color: rgba(168,85,247,0.5); box-shadow: 0 0 30px rgba(168,85,247,0.2), inset 0 0 40px rgba(168,85,247,0.08); }
    .tier-border-legendary { border-color: rgba(234,179,8,0.5); box-shadow: 0 0 40px rgba(234,179,8,0.25), inset 0 0 50px rgba(234,179,8,0.1); }
    .tier-border-transcendent {
      border-color: rgba(236,72,153,0.5);
      box-shadow: 0 0 50px rgba(139,92,246,0.3), 0 0 100px rgba(236,72,153,0.15), inset 0 0 60px rgba(139,92,246,0.1);
    }

    /* ── Streak number color by tier ─────────────────── */
    .streak-color-none          { color: #a5b4fc; }
    .streak-color-onFire        { color: #fdba74; text-shadow: 0 0 20px rgba(251,146,60,0.5); }
    .streak-color-blazing       { color: #93c5fd; text-shadow: 0 0 20px rgba(59,130,246,0.5); }
    .streak-color-unstoppable   { color: #c4b5fd; text-shadow: 0 0 25px rgba(168,85,247,0.5); }
    .streak-color-legendary     { color: #fde047; text-shadow: 0 0 30px rgba(234,179,8,0.5); }
    .streak-color-transcendent  {
      background: linear-gradient(90deg, #f472b6, #a78bfa, #38bdf8, #22d3ee, #a78bfa, #f472b6);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: prismatic-shift 3s linear infinite;
      filter: drop-shadow(0 0 20px rgba(139,92,246,0.5));
    }

    /* ── Leaderboard row highlight ───────────────────── */
    @keyframes lb-pulse {
      0%, 100% { background-color: rgba(139,92,246,0.1); }
      50%      { background-color: rgba(139,92,246,0.25); }
    }
    .lb-highlight {
      animation: lb-pulse 1.5s ease-in-out infinite;
    }

    /* ── SVG combo ring animation ────────────────────── */
    .combo-ring-track { stroke: rgba(255,255,255,0.08); }
    .combo-ring-fill  { transition: stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1); }

    /* ── Ambient sparkle orbits (varied radii + wobble) ── */
    @keyframes sparkle-orbit-a {
      0%   { transform: rotate(0deg) translateX(60px) rotate(0deg) scale(0.6); opacity: 0; }
      8%   { opacity: 0.9; }
      25%  { transform: rotate(90deg) translateX(72px) rotate(-90deg) scale(1); }
      50%  { transform: rotate(180deg) translateX(58px) rotate(-180deg) scale(0.7); }
      75%  { transform: rotate(270deg) translateX(76px) rotate(-270deg) scale(1.1); }
      92%  { opacity: 0.9; }
      100% { transform: rotate(360deg) translateX(60px) rotate(-360deg) scale(0.6); opacity: 0; }
    }
    @keyframes sparkle-orbit-b {
      0%   { transform: rotate(0deg) translateX(80px) rotate(0deg) scale(0.8); opacity: 0; }
      10%  { opacity: 0.7; }
      30%  { transform: rotate(-108deg) translateX(68px) rotate(108deg) scale(1.1); }
      60%  { transform: rotate(-216deg) translateX(82px) rotate(216deg) scale(0.6); }
      90%  { opacity: 0.8; }
      100% { transform: rotate(-360deg) translateX(74px) rotate(360deg) scale(0.9); opacity: 0; }
    }
    @keyframes sparkle-orbit-c {
      0%   { transform: rotate(40deg) translateX(66px) rotate(-40deg) scale(1); opacity: 0; }
      12%  { opacity: 0.8; }
      33%  { transform: rotate(160deg) translateX(78px) rotate(-160deg) scale(0.7); }
      66%  { transform: rotate(280deg) translateX(62px) rotate(-280deg) scale(1.2); }
      88%  { opacity: 0.7; }
      100% { transform: rotate(400deg) translateX(70px) rotate(-400deg) scale(0.8); opacity: 0; }
    }
    .ambient-sparkle {
      position: absolute;
      width: var(--spark-size, 4px);
      height: var(--spark-size, 4px);
      border-radius: 50%;
      background: var(--spark-color, rgba(165,180,252,0.8));
      box-shadow: 0 0 6px 2px var(--spark-color, rgba(165,180,252,0.4));
      top: 50%;
      left: 50%;
      margin: calc(var(--spark-size, 4px) / -2);
      animation: var(--spark-anim, sparkle-orbit-a) var(--spark-duration, 6s) linear infinite;
      animation-delay: var(--spark-delay, 0s);
      pointer-events: none;
    }

    /* ── Twinkle star ─────────────────────────────────── */
    @keyframes twinkle {
      0%, 100% { opacity: 0.15; transform: scale(0.8); }
      50%      { opacity: 0.7; transform: scale(1.2); }
    }
    .ambient-twinkle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: white;
      animation: twinkle var(--twinkle-duration, 3s) ease-in-out infinite;
      animation-delay: var(--twinkle-delay, 0s);
      pointer-events: none;
    }

    /* ── "+1" float up ───────────────────────────────── */
    @keyframes float-up {
      0%   { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-60px); opacity: 0; }
    }
    .animate-float-up {
      animation: float-up 0.8s ease-out forwards;
    }

    /* ── Edge flash ──────────────────────────────────── */
    @keyframes edge-flash-green {
      0%   { opacity: 0.5; }
      100% { opacity: 0; }
    }
    .edge-flash-green {
      animation: edge-flash-green 0.5s ease-out forwards;
      box-shadow: inset 0 0 60px rgba(34,197,94,0.3);
    }
    @keyframes edge-flash-red {
      0%   { opacity: 0.6; }
      100% { opacity: 0; }
    }
    .edge-flash-red {
      animation: edge-flash-red 0.6s ease-out forwards;
      box-shadow: inset 0 0 80px rgba(239,68,68,0.4);
    }

    /* ── Confetti burst helper ────────────────────────── */
    @keyframes confetti-fall {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
    }

    /* ── Score submit modal glow ─────────────────────── */
    @keyframes trophy-glow {
      0%, 100% { text-shadow: 0 0 10px rgba(234,179,8,0.3); }
      50%      { text-shadow: 0 0 30px rgba(234,179,8,0.7), 0 0 60px rgba(234,179,8,0.3); }
    }
    .animate-trophy-glow {
      animation: trophy-glow 2s ease-in-out infinite;
    }
  `}</style>
);
