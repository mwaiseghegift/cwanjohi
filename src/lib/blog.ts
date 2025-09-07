export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    category: string;
    tags: string[];
    readTime: number;
    featured: boolean;
    slug: string;
    coverImage?: string;
}

export interface BlogCategory {
    id: string;
    name: string;
    description: string;
    color: string;
}

export const blogCategories: BlogCategory[] = [
    {
        id: "tech",
        name: "Technology",
        description: "Latest in tech, programming, and development",
        color: "from-blue-500 to-cyan-500",
    },
    {
        id: "web-dev",
        name: "Web Development",
        description: "Frontend, backend, and full-stack development",
        color: "from-green-500 to-emerald-500",
    },
    {
        id: "data-analysis",
        name: "Data Analysis",
        description: "Excel, data visualization, and analytics",
        color: "from-purple-500 to-violet-500",
    },
    {
        id: "productivity",
        name: "Productivity",
        description: "Tools, tips, and workflows for better productivity",
        color: "from-orange-500 to-red-500",
    },
    {
        id: "insights",
        name: "Insights",
        description: "Personal thoughts and industry insights",
        color: "from-pink-500 to-rose-500",
    },
];

// Calculate reading time based on word count
export function calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// Generate slug from title
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
}
