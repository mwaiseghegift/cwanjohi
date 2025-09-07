'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    FileSpreadsheet,
    BookOpen,
    Github,
    Code2,
    GitCompare,
} from 'lucide-react'

const features = [
    {
        id: 1,
        title: 'Excel Analysis',
        description: 'Advanced spreadsheet analysis',
        icon: FileSpreadsheet,
        color: 'from-green-400 to-green-600',
        link: '/excel-analysis',
        external: false
    },
    {
        id: 2,
        title: 'Data Comparison',
        description: 'Compare multiple data sources for discrepancies',
        icon: GitCompare,
        color: 'from-purple-400 to-purple-600',
        link: '/data-comparison',
        external: false
    },
    {
        id: 3,
        title: 'Personal Blog',
        description: 'Thoughts, insights, and stories',
        icon: BookOpen,
        color: 'from-blue-400 to-blue-600',
        link: '/blog',
        external: false
    },
    {
        id: 4,
        title: 'GitHub Profile',
        description: 'Explore my open source projects',
        icon: Github,
        color: 'from-gray-400 to-gray-600',
        link: 'https://github.com',
        external: true
    },
    {
        id: 5,
        title: 'Code Projects',
        description: 'Interactive coding experiments',
        icon: Code2,
        color: 'from-indigo-400 to-indigo-600',
        link: '/projects',
        external: false
    },
]

const FeatureGrid = () => {
    const router = useRouter()

    const handleFeatureClick = (link: string, external: boolean) => {
        if (external) {
            window.open(link, '_blank')
        } else {
            router.push(link)
        }
    }

    return (
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.map((feature, index) => {
                const IconComponent = feature.icon

                return (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        viewport={{ once: true }}
                        whileHover={{
                            scale: 1.05,
                            rotateZ: 2,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleFeatureClick(feature.link, feature.external)}
                        className="group cursor-pointer"
                    >
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700">
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                            {/* Icon */}
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} text-white mb-4`}
                            >
                                <IconComponent size={24} />
                            </motion.div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                {feature.title}
                            </h3>

                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover arrow */}
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                whileHover={{ x: 0, opacity: 1 }}
                                className="absolute top-4 right-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </motion.div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

export default FeatureGrid
