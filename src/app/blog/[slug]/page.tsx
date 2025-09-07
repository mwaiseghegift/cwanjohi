'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { blogPosts } from '@/data/blog-posts'
import { blogCategories } from '@/lib/blog'
import Link from 'next/link'
import 'highlight.js/styles/github-dark.css'

export default function BlogPostPage() {
    const params = useParams()
    const slug = params.slug as string

    const post = blogPosts.find(p => p.slug === slug)

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-500 dark:to-slate-400 py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Post Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        The blog post you&apos;re looking for doesn&apos;t exist.
                    </p>
                    <Link
                        href="/blog"
                        className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </div>
            </div>
        )
    }

    const category = blogCategories.find(cat => cat.id === post.category)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-20 px-6">
            <article className="max-w-4xl mx-auto">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link
                        href="/blog"
                        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {/* Category */}
                    {category && (
                        <div className="mb-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${category.color}`}>
                                {category.name}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{format(new Date(post.publishedAt), 'MMMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{post.readTime} min read</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm rounded-full"
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Featured Image */}
                    <div className="relative h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl overflow-hidden mb-8">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <h2 className="text-white text-2xl md:text-4xl font-bold text-center px-8">
                                {post.title}
                            </h2>
                        </div>
                    </div>
                </motion.header>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 dark:border-slate-700"
                >
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 mt-8">
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3 mt-6">
                                        {children}
                                    </h3>
                                ),
                                p: ({ children }) => (
                                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                        {children}
                                    </p>
                                ),
                                code: ({ children, className }) => {
                                    const isInline = !className
                                    if (isInline) {
                                        return (
                                            <code className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm">
                                                {children}
                                            </code>
                                        )
                                    }
                                    return (
                                        <div className="my-6">
                                            <code className={className}>
                                                {children}
                                            </code>
                                        </div>
                                    )
                                },
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                                        {children}
                                    </ol>
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-6">
                                        {children}
                                    </blockquote>
                                )
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </motion.div>

                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <Link
                        href="/blog"
                        className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to All Posts
                    </Link>
                </motion.div>
            </article>
        </div>
    )
}