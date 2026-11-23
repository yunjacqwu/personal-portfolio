"use client";

import { useRef } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";

interface SkillsProps {
  dict: {
    title: string;
    accent: string;
  };
}

type Skill = { name: string; img: string };

const topRowSkills: Skill[] = [
  { name: "Laravel", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" },
  { name: "ReactJS", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
  { name: "Tailwind CSS", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "PostgreSQL", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" },
  { name: "Next.js", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" },
];

const bottomRowSkills: Skill[] = [
  { name: "PHP", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" },
  { name: "MySQL", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg" },
  { name: "TypeScript", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
  { name: "Figma", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg" },
  { name: "Git", img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" },
];

const BASE_SPEED = 0.05; // px per ms, auto-scroll speed
const MAX_FLING = 7; // px per ms, cap so a fast drag can't spin the row
const FRICTION_PER_16MS = 0.97; // fling slows down by this factor every ~16ms, lower = berhenti lebih cepat

export default function Skills({ dict }: SkillsProps) {
  const multipliedTop = [...topRowSkills, ...topRowSkills, ...topRowSkills, ...topRowSkills];
  const multipliedBottom = [...bottomRowSkills, ...bottomRowSkills, ...bottomRowSkills, ...bottomRowSkills];

  return (
    <section id="skills" className="py-10 overflow-hidden relative select-none">
      {/* Judul besar dan tebal, persis seperti section Projects */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16 relative z-20"
      >
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-brand-text">
          {dict.title} <span className="text-brand-pink">{dict.accent}</span>.
        </h2>
      </motion.div>

      <div className="flex flex-col gap-6 md:gap-8 relative">
        {/* Gradient Blur di Kiri dan Kanan */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none" />

        <SkillRow items={multipliedTop} direction={-1} delay={0.1} fromX={-40} />
        <SkillRow items={multipliedBottom} direction={1} delay={0.2} fromX={40} />
      </div>
    </section>
  );
}

// Satu baris skill: auto-scroll, bisa di-drag, dan drag yang dilepas akan melambat pelan-pelan
function SkillRow({
  items,
  direction,
  delay,
  fromX,
}: {
  items: Skill[];
  direction: 1 | -1;
  delay: number;
  fromX: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const fling = useRef(0); // px per ms, sisa momentum dari drag
  const lastPoint = useRef<{ x: number; t: number } | null>(null); // non-null saat sedang di-drag
  const anchor = useRef<{ x: number; t: number } | null>(null); // titik acuan untuk menghitung kecepatan
  const hovered = useRef(false);

  useAnimationFrame((_, delta) => {
    const period = (trackRef.current?.offsetWidth ?? 0) / 2; // lebar satu salinan daftar
    if (!period) return;

    const dragging = lastPoint.current !== null;
    const autoSpeed = dragging || hovered.current ? 0 : BASE_SPEED * direction;

    if (!dragging) fling.current *= Math.pow(FRICTION_PER_16MS, delta / 16);

    // Modulo menjaga posisi tetap dalam satu periode, jadi loop tidak pernah putus
    const next = x.get() + (autoSpeed + fling.current) * delta;
    x.set(((((next % period) + period) % period) - period));
  });

  const clamp = (v: number) => Math.max(-MAX_FLING, Math.min(MAX_FLING, v));

  return (
    <motion.div
      initial={{ opacity: 0, x: fromX }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onMouseEnter={() => (hovered.current = true)}
      onMouseLeave={() => (hovered.current = false)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        lastPoint.current = { x: e.clientX, t: e.timeStamp };
        anchor.current = { x: e.clientX, t: e.timeStamp };
        fling.current = 0;
      }}
      onPointerMove={(e) => {
        const last = lastPoint.current;
        if (!last) return;
        lastPoint.current = { x: e.clientX, t: e.timeStamp };
        x.set(x.get() + e.clientX - last.x);
        // Kecepatan dihitung dari jarak tempuh selama ≥40ms terakhir, bukan satu gerakan kecil
        const a = anchor.current!;
        const elapsed = e.timeStamp - a.t;
        if (elapsed >= 40) {
          fling.current = clamp((e.clientX - a.x) / elapsed);
          anchor.current = { x: e.clientX, t: e.timeStamp };
        }
      }}
      onPointerUp={(e) => {
        // Mouse diam sebelum lepas = tidak ada lemparan
        if (lastPoint.current && e.timeStamp - lastPoint.current.t > 80) fling.current = 0;
        lastPoint.current = null;
      }}
      onPointerCancel={() => {
        lastPoint.current = null;
        fling.current = 0;
      }}
      className="w-full cursor-grab active:cursor-grabbing touch-pan-y"
    >
      <motion.div ref={trackRef} style={{ x }} className="flex w-max py-4">
        <div className="flex gap-4 md:gap-6 pr-4 md:pr-6">
          {items.map((skill, index) => (
            <SkillCard key={`a-${index}`} skill={skill} />
          ))}
        </div>
        <div className="flex gap-4 md:gap-6 pr-4 md:pr-6">
          {items.map((skill, index) => (
            <SkillCard key={`b-${index}`} skill={skill} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Komponen Card dengan hover interaktif
function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="group flex items-center gap-3 md:gap-4 px-6 md:px-8 py-4 md:py-5 bg-white/60 backdrop-blur-md border border-brand-text/10 rounded-[24px] shadow-sm hover:shadow-xl hover:scale-110 hover:-translate-y-2 hover:border-brand-purple/30 hover:bg-white transition-all duration-300 cursor-pointer">
      <img
        src={skill.img}
        alt={skill.name}
        draggable={false}
        className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
      />
      <span className="font-bold text-brand-text group-hover:text-brand-purple text-base md:text-lg whitespace-nowrap transition-colors duration-300">
        {skill.name}
      </span>
    </div>
  );
}
