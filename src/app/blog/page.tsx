'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
// import BlogCard from '@/components/blog/BlogCard'
import CategoryFilter from '@/components/blog/CategoryFilter'
// import SearchBar from '@/components/blog/SearchBar'
import { blogPosts } from '@/data/blog-posts'
import { BookOpen, TrendingUp, Clock } from 'lucide-react'
import SearchBar from '@/components/blog/SearchBar'
import BlogCard from '@/components/blog/BlogCard'

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPosts = useMemo(() => {
        return blogPosts.filter(post => {
            const matchesCategory = !selectedCategory || post.category === selectedCategory
            const matchesSearch = !searchQuery ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

            return matchesCategory && matchesSearch
        })
    }, [selectedCategory, searchQuery])

    const featuredPosts = filteredPosts.filter(post => post.featured)
    const regularPosts = filteredPosts.filter(post => !post.featured)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-500 dark:to-slate-400 py-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Blog
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Thoughts, insights, and stories from the world of technology, development, and productivity.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center">
                            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {blogPosts.length}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Posts
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center">
                            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {featuredPosts.length}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Featured Posts
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {Math.round(blogPosts.reduce((acc, post) => acc + post.readTime, 0) / blogPosts.length)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Avg. Read Time (min)
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filter */}
                <SearchBar onSearch={setSearchQuery} />
                <CategoryFilter
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />

                {/* Results count */}
                {(searchQuery || selectedCategory) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8"
                    >
                        <p className="text-gray-600 dark:text-gray-400">
                            Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                            {selectedCategory && ` in ${selectedCategory}`}
                            {searchQuery && ` matching "${searchQuery}"`}
                        </p>
                    </motion.div>
                )}

                {/* Featured Posts */}
                {featuredPosts.length > 0 && !searchQuery && !selectedCategory && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center">
                            <TrendingUp className="w-6 h-6 mr-2 text-yellow-500" />
                            Featured Posts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featuredPosts.map((post) => (
                                <BlogCard key={post.id} post={post} featured />
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* All Posts */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
                        {featuredPosts.length > 0 && !searchQuery && !selectedCategory ? 'Latest Posts' : 'All Posts'}
                    </h2>

                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-16">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                No posts found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-500">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(featuredPosts.length > 0 && !searchQuery && !selectedCategory ? regularPosts : filteredPosts).map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <BlogCard post={post} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    )
}