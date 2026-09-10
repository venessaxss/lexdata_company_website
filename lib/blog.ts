import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const blogsDirectory = path.join(process.cwd(), 'content/blogs');

export interface BlogMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  aiModels?: string[];
  coverImage?: string;
}

// List of all blogs (for the listing page)
export function getAllBlogs(): BlogMeta[] {
  const fileNames = fs.readdirSync(blogsDirectory).filter(f => f.endsWith('.md'));

  const blogs = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(blogsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title,
      date: data.date,
      excerpt: data.excerpt || '',
      aiModels: data.aiModels || [],
      coverImage: data.coverImage || null,
    };
  });

  // Newest first
  return blogs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Full content of a single blog (for the detail page)
export async function getBlogBySlug(slug: string) {
  const fullPath = path.join(blogsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt || '',
    aiModels: data.aiModels || [],
    coverImage: data.coverImage || null,
    contentHtml,
  };
}