'use client'

import { motion } from 'framer-motion'
import { blogCategories } from '@/lib/blog'

interface CategoryFilterProps {
    selectedCategory: string | null
    onCategoryChange: (category: string | null) => void
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap gap-3 mb-8">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === null
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
            >
                All Posts
            </motion.button>

            {blogCategories.map((category) => (
                <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.id
                            ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                >
                    {category.name}
                </motion.button>
            ))}
        </div>
    )
}