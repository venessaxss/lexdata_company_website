import Link from "next/link";

type CategoryRelation =
  | { name?: string | null }
  | { name?: string | null }[]
  | null;

type CourseCardProps = {
  course: {
    title: string;
    slug: string;
    short_description: string | null;
    level: string | null;
    language: string | null;
    cover_url: string | null;
    categories?: CategoryRelation;
  };
};

function categoryName(categories: CategoryRelation) {
  const category = Array.isArray(categories)
    ? categories[0]
    : categories;

  return category?.name || null;
}

export default function CourseCard({
  course,
}: CourseCardProps) {
  const category = categoryName(
    course.categories || null
  );

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex min-h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden bg-slate-900">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 p-6 text-white">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                LexData course
              </p>

              <p className="mt-2 max-w-xs text-lg font-black leading-tight">
                AI, language, data, and research skills
              </p>
            </div>
          </div>
        )}

        {category ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-800 shadow-sm">
            {category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {course.level || "Open level"}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {course.language || "English"}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-black leading-tight text-slate-950 transition group-hover:text-blue-700">
          {course.title}
        </h3>

        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
          {course.short_description ||
            "Practical learning designed to connect research questions with computational and digital methods."}
        </p>

        <div className="mt-auto pt-6">
          <span className="text-sm font-black text-blue-700">
            View course &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}