'use client';
import { motion, useScroll } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60]"
      style={{
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #A78BFA, #34D399, #6366F1)',
        boxShadow: '0 0 12px rgba(167, 139, 250, 0.6)',
      }}
    />
  );
}