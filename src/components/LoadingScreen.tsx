'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div style={{ backgroundColor: '#FAF8F4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ShieldCheck size={56} color="#0F6E64" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: '#59524A', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-body)' }}
      >
        Loading PublicCare...
      </motion.p>
    </div>
  );
}
