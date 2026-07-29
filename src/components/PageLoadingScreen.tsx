'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageLoadingScreenProps {
  /** Optional subtitle shown beneath the brand name */
  subtitle?: string;
  /** Controlled: if true the overlay is visible, if false it exits */
  isLoading: boolean;
}

const BRAND = 'PublicCare';

/**
 * Full-screen loading overlay with a clipping/scale reveal animation
 * and a typewriter-style brand name.
 *
 * Usage:
 *   <PageLoadingScreen isLoading={loading} subtitle="Verifying credentials…" />
 */
export default function PageLoadingScreen({ subtitle, isLoading }: PageLoadingScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  // Reset typewriter when overlay becomes visible again
  useEffect(() => {
    if (isLoading) {
      setDisplayedText('');
      setCharIndex(0);
    }
  }, [isLoading]);

  // Typewriter tick
  useEffect(() => {
    if (!isLoading) return;
    if (charIndex >= BRAND.length) return;
    const timeout = setTimeout(() => {
      setDisplayedText((prev) => prev + BRAND[charIndex]);
      setCharIndex((prev) => prev + 1);
    }, 80);
    return () => clearTimeout(timeout);
  }, [charIndex, isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="page-loading-overlay"
          initial={{ opacity: 0, scale: 1.08, clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ opacity: 0, scale: 0.96, clipPath: 'inset(100% 0% 0% 0%)' }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: 'fixed',
            inset: 0,
            // Sits above any app navbar/header regardless of their own z-index.
            zIndex: 999999,
            backgroundColor: '#0F6E64',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          {/* Decorative blurred circle (top-left) */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 0.18, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{
              position: 'absolute',
              top: '-80px',
              left: '-80px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }}
          />
          {/* Decorative blurred circle (bottom-right) */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 0.12, x: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '-80px',
              right: '-80px',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              filter: 'blur(70px)',
              pointerEvents: 'none',
            }}
          />

          {/* Brand name — typewriter, italic curvy display font */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
            style={{
              fontFamily:
                'var(--font-display, "Playfair Display", "Bookman Old Style", Georgia, "Times New Roman", serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              lineHeight: 1,
              position: 'relative',
            }}
          >
            {displayedText}
            {/* blinking cursor */}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                display: 'inline-block',
                width: '3px',
                height: '0.85em',
                backgroundColor: '#ffffff',
                marginLeft: '4px',
                verticalAlign: 'middle',
                borderRadius: '2px',
              }}
            />
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
                color: '#ffffff',
                letterSpacing: '0.01em',
              }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Animated progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              style={{
                width: '40%',
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '2px',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}