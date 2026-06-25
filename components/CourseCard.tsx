import Link from "next/link";

type CourseCardProps = {
  course: {
    title: string;
    slug: string;
    short_description: string | null;
    level: string | null;
    language: string | null;
    cover_url: string | null;
  };
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-44 bg-slate-200">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt={course.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900 text-white">
            LexData
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-3 flex gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {course.level || "Beginner"}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {course.language || "English"}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-950 group-hover:text-blue-700">
          {course.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {course.short_description}
        </p>

        <p className="mt-5 font-semibold text-blue-700">
          View course →
        </p>
      </div>
    </Link>
  );
}