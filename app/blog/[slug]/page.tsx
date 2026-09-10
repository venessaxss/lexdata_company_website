import { getBlogBySlug, getAllBlogs } from "@/lib/blog";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const blogs = getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let blog;
  try {
    blog = await getBlogBySlug(slug);
  } catch {
    return notFound();
  }

  return (
    <article className="blog-article">
      <p className="blog-article-date">{blog.date}</p>
      <h1 className="blog-article-title">{blog.title}</h1>
      {blog.aiModels && blog.aiModels.length > 0 && (
        <div className="blog-article-tags">
          {blog.aiModels.map((model: string) => (
            <span key={model} className="blog-article-tag">
              {model}
            </span>
          ))}
        </div>
      )}
      <div
        className="blog-article-body"
        dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
      />
    </article>
  );
}