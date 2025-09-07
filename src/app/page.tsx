'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FeatureGrid from '@/components/FeatureGrid'
import Image from 'next/image'

export default function Home() {
  const [showFeatures, setShowFeatures] = useState(false)

  return (
    <main className="min-h-screen dark:bg-slate-400 overflow-hidden">
      <AnimatePresence mode="wait">
        {!showFeatures ? (
          // Hero/Landing Page
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6 }}
            className="relative min-h-screen flex items-center justify-between px-12 md:px-20"
          >
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-gray-900 dark:text-gray-900 leading-tight">
                This
                <br />
                Is
                <br />
                Cyrus
              </h1>
            </motion.div>

            {/* Navigation Arrow */}
            <motion.button
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.1, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFeatures(true)}
              className="absolute top-12 right-12 md:top-16 md:right-16 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-700 transition-colors duration-300"
            >
              <Image
                src="/angle-small-right.svg"
                alt="Navigate to features"
                width={100}
                height={100}
                className="w-8 h-8 md:w-40 md:h-40"
              />
            </motion.button>

            {/* SVG Character */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-12 right-12 md:bottom-16 md:right-16"
            >
              <Image
                src="/worker.png"
                alt="Character illustration"
                width={80}
                height={96}
                className="w-16 h-20 md:w-50 md:h-58"
              />
            </motion.div>
          </motion.div>
        ) : (
          // Features Page
          <motion.div
            key="features"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-400 dark:to-slate-200"
          >
            {/* Back Arrow */}
            <motion.button
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.1, x: -10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFeatures(false)}
              className="fixed top-12 left-12 md:top-16 md:left-16 z-10 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300"
            >
              <Image
                src="/cross.svg"
                alt="Go back to home"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
            </motion.button>

            {/* Features Content */}
            <section className="relative py-20 px-6 pt-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="max-w-6xl mx-auto"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800 dark:text-gray-100">
                  Discover Features
                </h2>
                <FeatureGrid />
              </motion.div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}