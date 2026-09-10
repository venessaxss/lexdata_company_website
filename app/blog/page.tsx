import LexPaperSubPage from "@/components/LexPaperSubPage";
import { getAllBlogs } from "@/lib/blog";

export default function BlogPage() {
  const blogs = getAllBlogs();

  return (
    <div className="blog-page">
      <LexPaperSubPage
        kicker="Blog"
        title="Research notes from the LexData studio."
        body="Comparative guides, updates, and tutorials on AI models, NLP, and translation technology."
        cards={blogs.map((blog) => ({
          title: blog.title,
          body: blog.excerpt,
          href: `/blog/${blog.slug}`,
          meta: `${blog.date}${blog.aiModels ? " · " + blog.aiModels.join(", ") : ""}`,
        }))}
      />
    </div>
  );
}