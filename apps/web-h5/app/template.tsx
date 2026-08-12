'use client';

import { motion, useReducedMotion } from 'motion/react';

const smoothEase = [0.22, 1, 0.36, 1] as const;

export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.28, ease: smoothEase }}
    >
      {children}
    </motion.div>
  );
}
