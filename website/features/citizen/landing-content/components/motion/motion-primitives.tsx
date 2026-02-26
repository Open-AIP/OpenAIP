"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export const VIEWPORT_ONCE = { once: true, amount: 0.45 } as const;

export const MOTION_TOKENS = {
  enterDuration: 0.65,
  hoverDuration: 0.18,
  stagger: 0.08,
  enterEase: "easeOut",
  hoverEase: "easeInOut",
} as const;

type StaggerContainerOptions = {
  staggerChildren?: number;
  delayChildren?: number;
};

function resolveEnterDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0.2 : MOTION_TOKENS.enterDuration;
}

export function fadeUp(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: resolveEnterDuration(reducedMotion),
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };
}

export function fadeIn(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: resolveEnterDuration(reducedMotion),
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };
}

export function scaleIn(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: resolveEnterDuration(reducedMotion),
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };
}

export function staggerContainer(
  reducedMotion: boolean,
  options: StaggerContainerOptions = {}
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : (options.staggerChildren ?? MOTION_TOKENS.stagger),
        delayChildren: reducedMotion ? 0 : (options.delayChildren ?? 0),
      },
    },
  };
}

export function staggerItem(reducedMotion: boolean): Variants {
  return fadeUp(reducedMotion);
}

type MotionInViewProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  variant?: "fadeUp" | "fadeIn" | "scaleIn";
};

function resolvePresetVariant(
  reducedMotion: boolean,
  variant: MotionInViewProps["variant"] | undefined
): Variants {
  if (variant === "fadeIn") {
    return fadeIn(reducedMotion);
  }
  if (variant === "scaleIn") {
    return scaleIn(reducedMotion);
  }
  return fadeUp(reducedMotion);
}

export function MotionInView({ children, className, variants, variant }: MotionInViewProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={variants ?? resolvePresetVariant(reducedMotion, variant)}
    >
      {children}
    </motion.div>
  );
}

type MotionStaggerProps = {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  variants?: Variants;
};

export function MotionStagger({
  children,
  className,
  delayChildren,
  staggerChildren,
  variants,
}: MotionStaggerProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={
        variants ??
        staggerContainer(reducedMotion, {
          delayChildren,
          staggerChildren,
        })
      }
    >
      {children}
    </motion.div>
  );
}

type MotionItemProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  variant?: "fadeUp" | "fadeIn" | "scaleIn";
};

export function MotionItem({ children, className, variants, variant }: MotionItemProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      variants={variants ?? (variant ? resolvePresetVariant(reducedMotion, variant) : staggerItem(reducedMotion))}
    >
      {children}
    </motion.div>
  );
}

type MotionPressableProps = {
  children: ReactNode;
  className?: string;
};

export function MotionPressable({ children, className }: MotionPressableProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{
        duration: reducedMotion ? 0.12 : MOTION_TOKENS.hoverDuration,
        ease: MOTION_TOKENS.hoverEase,
      }}
    >
      {children}
    </motion.div>
  );
}
