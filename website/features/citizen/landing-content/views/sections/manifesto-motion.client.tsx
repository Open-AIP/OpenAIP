"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MOTION_TOKENS, VIEWPORT_ONCE } from "../../components/motion/motion-primitives";

type ManifestoMotionProps = {
  eyebrow: string;
  lines: string[];
  emphasis: string;
  supportingLine: string;
};

export default function ManifestoMotion({
  eyebrow,
  lines,
  emphasis,
  supportingLine,
}: ManifestoMotionProps) {
  const reducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  };

  const itemFadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.24 : 0.45,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  const linesContainer: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: reducedMotion ? 0.08 : 0.28,
        staggerChildren: reducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemFadeUp: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.26 : 0.7,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  const itemScaleIn: Variants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.99 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0.24 : 0.95,
        delay: reducedMotion ? 0.14 : 1.52,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  const supportFadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.22 : 0.35,
        delay: reducedMotion ? 0.2 : 1.68,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  return (
    <motion.div
      className="w-full text-center"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={containerVariants}
    >
      <motion.p
        className="text-center text-xl font-semibold leading-[24px] tracking-[0.7px] text-steelblue"
        variants={itemFadeIn}
      >
        {eyebrow}
      </motion.p>

      <motion.div className="mt-6 space-y-2" variants={linesContainer}>
        {lines.map((line, index) => (
          <motion.p
            key={`${line}-${index}`}
            className="text-center text-6xl font-bold leading-[60px] text-darkslategray"
            variants={itemFadeUp}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>

      <motion.p
        className="mt-6 text-center text-7xl font-bold text-steelblue drop-shadow-[0px_3px_10px_rgba(0,0,0,0.25)]"
        variants={itemScaleIn}
      >
        {emphasis}
      </motion.p>

      <motion.p className="mt-4 text-center text-xl leading-7 text-gray" variants={supportFadeIn}>
        {supportingLine}
      </motion.p>
    </motion.div>
  );
}
