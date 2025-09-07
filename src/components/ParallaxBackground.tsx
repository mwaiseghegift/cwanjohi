'use client'

import { motion } from 'framer-motion'

interface ParallaxBackgroundProps {
    scrollY: number
}

const ParallaxBackground = ({ scrollY }: ParallaxBackgroundProps) => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Animated background shapes */}
            <motion.div
                style={{ y: scrollY * 0.5 }}
                className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <motion.div
                style={{ y: scrollY * -0.3 }}
                className="absolute top-1/3 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <motion.div
                style={{ y: scrollY * 0.2 }}
                className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -180, -360],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Floating particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/30 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        y: scrollY * (Math.random() * 0.5 + 0.1)
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
        </div>
    )
}

export default ParallaxBackground