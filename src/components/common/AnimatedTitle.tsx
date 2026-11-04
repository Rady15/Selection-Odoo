import React from 'react';
import { motion } from 'motion/react';

interface AnimatedTitleProps {
 title: string;
 subtitle?: string;
 className?: string;
 badge?: string;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
 title,
 subtitle,
 className = '',
 badge
}) => {
 const words = title.split(' ');

 return (
 <div className={`space-y-1.5 ${className}`}>
 {badge && (
 <motion.div
 initial={{ opacity: 0, scale: 0.8, y: 10 }}
 whileInView={{ opacity: 1, scale: 1, y: 0 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.4 }}
 className="inline-block"
 >
 <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0E5257]/30 border border-[#6CC6C9]/40 text-[#6CC6C9]">
 {badge}
 </span>
 </motion.div>
 )}

 <motion.h2
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, margin: '-30px' }}
 variants={{
 visible: {
 transition: {
 staggerChildren: 0.08,
 delayChildren: 0.1
 }
 },
 hidden: {}
 }}
 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif tracking-tight leading-snug flex flex-wrap"
 >
 {words.map((word, index) => (
 <motion.span
 key={index}
 variants={{
 hidden: {
 opacity: 0,
 y: 24,
 rotateX: -40,
 filter: 'blur(6px)'
 },
 visible: {
 opacity: 1,
 y: 0,
 rotateX: 0,
 filter: 'blur(0px)',
 transition: {
 type: 'spring',
 damping: 12,
 stiffness: 120
 }
 }
 }}
 className="inline-block animate-cup-fill mr-2 sm:mr-3"
 style={{ transformOrigin: 'bottom center' }}
 >
 {word}
 </motion.span>
 ))}
 </motion.h2>

 {subtitle && (
 <motion.p
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.5, delay: 0.4 }}
 className="text-xs sm:text-sm text-[#6B8C8E]"
 >
 {subtitle}
 </motion.p>
 )}
 </div>
 );
};

export default AnimatedTitle;
