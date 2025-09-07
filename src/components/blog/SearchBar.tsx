'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = "Search posts..." }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearch(query)
    }

    const handleClear = () => {
        setQuery('')
        onSearch('')
    }

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="relative mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={`relative transition-all duration-200 ${isFocused ? 'scale-105' : 'scale-100'
                }`}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                />

                <AnimatePresence>
                    {query && (
                        <motion.button
                            type="button"
                            onClick={handleClear}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.form>
    )
}