'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { BlogPost, blogCategories } from '@/lib/blog'
import { useRouter } from 'next/navigation'

interface BlogCardProps {
    post: BlogPost
    featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
    const router = useRouter()
    const category = blogCategories.find(cat => cat.id === post.category)

    const handleClick = () => {
        router.push(`/blog/${post.slug}`)
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            onClick={handleClick}
            className={`cursor-pointer bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 ${featured ? 'md:col-span-2' : ''
                }`}
        >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 left-4">
                    {category && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${category.color} backdrop-blur-sm`}>
                            {category.name}
                        </span>
                    )}
                </div>
                {post.featured && (
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-yellow-500">
                            Featured
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <h2 className={`font-bold text-gray-800 dark:text-gray-100 mb-3 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${featured ? 'text-2xl' : 'text-xl'
                    }`}>
                    {post.title}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs rounded-md"
                        >
                            {tag}
                        </span>
                    ))}
                    {post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                            +{post.tags.length - 3}
                        </span>
                    )}
                </div>

                {/* Meta information */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{format(new Date(post.publishedAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{post.readTime} min read</span>
                        </div>
                    </div>

                    <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center text-blue-600 dark:text-blue-400"
                    >
                        <span className="mr-1">Read more</span>
                        <ArrowRight className="w-4 h-4" />
                    </motion.div>
                </div>
            </div>
        </motion.article>
    )
}