'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navItems = [
        { name: 'Features', href: '#features' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact', href: '#contact' }
    ]

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
                        >
                            Cyrus
                        </motion.div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item, index) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {item.href.startsWith('#') ? (
                                    <a
                                        href={item.href}
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-gray-700 dark:text-gray-300"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 pb-4"
                    >
                        {navItems.map((item) => (
                            <motion.div
                                key={item.name}
                                whileHover={{ x: 10 }}
                            >
                                {item.href.startsWith('#') ? (
                                    <a
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.nav>
    )
}

export default Navbar