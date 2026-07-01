'use client';
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  stagger?: number;
  staggerSelector?: string;
  as?: 'div' | 'section' | 'article' | 'span';
  style?: React.CSSProperties;
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  y = 40,
  stagger = 0,
  staggerSelector,
  as: Tag = 'div',
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        if (staggerSelector) {
          gsap.set(ref.current.querySelectorAll(staggerSelector), { opacity: 1, y: 0 });
        }
        return;
      }

      if (stagger && staggerSelector) {
        // Stagger children
        const children = ref.current.querySelectorAll(staggerSelector);
        gsap.set(children, { opacity: 0, y });
        gsap.set(ref.current, { opacity: 1 });
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once: true,
          },
        });
      } else {
        // Single element reveal
        gsap.set(ref.current, { opacity: 0, y });
        gsap.to(ref.current, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once: true,
          },
        });
      }
    },
    { scope: ref }
  );

  // Use type assertion since Tag is dynamic
  const Component = Tag as React.ElementType;

  return (
    <Component ref={ref} className={`gs-reveal ${className}`} style={style}>
      {children}
    </Component>
  );
}
