$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\improve-course-learning-pathways-$timestamp"

$coursesPagePath = Join-Path $root "app\courses\page.tsx"
$courseCardPath = Join-Path $root "components\CourseCard.tsx"

foreach ($path in @($coursesPagePath, $courseCardPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the LexData project root."
    }
}

function Backup-File {
    param([string]$Path)
    $relative = $Path.Substring($root.Length).TrimStart("\", "/")
    $destination = Join-Path $backupRoot $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $Path -Destination $destination -Force
}

function Write-Utf8 {
    param([string]$Path,[string]$Content)
    [System.IO.File]::WriteAllText($Path,$Content,$utf8)
}

Backup-File $coursesPagePath
Backup-File $courseCardPath

$coursesPage = @'
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  level: string | null;
  language: string | null;
  cover_url: string | null;
  categories:
    | { name?: string | null }
    | { name?: string | null }[]
    | null;
};

const learnerLevels = [
  {
    label: "Foundation",
    audience: "Students, humanities learners, and first-time coders",
    description:
      "Build confidence with Python, data, research computing, AI literacy, and reproducible digital workflows.",
    search: "Beginner",
    marker: "01",
  },
  {
    label: "Applied",
    audience: "MA / PhD researchers and early-career academics",
    description:
      "Use coding, corpus methods, NLP, statistics, and AI to answer real research questions and build publishable projects.",
    search: "Intermediate",
    marker: "02",
  },
  {
    label: "Advanced",
    audience: "Computational researchers and technical specialists",
    description:
      "Move into multilingual NLP, computational linguistics, advanced corpus analysis, LLM workflows, and research software.",
    search: "Advanced",
    marker: "03",
  },
  {
    label: "Professional",
    audience: "Faculty, research labs, institutions, and cross-functional teams",
    description:
      "Develop institution-ready AI, data, Digital Humanities, teaching, and research workflows that connect people and technology.",
    search: "Professional",
    marker: "04",
  },
];

const topicTracks = [
  {
    title: "Coding foundations",
    lead: "Learn to build, automate, and reason with code.",
    topics: ["Python", "Git and reproducible workflows", "APIs and automation", "Data structures"],
    search: "Python",
  },
  {
    title: "NLP and computational linguistics",
    lead: "Turn language into analyzable computational data.",
    topics: ["Text preprocessing", "Embeddings and transformers", "Multilingual NLP", "LLMs for language research"],
    search: "NLP",
  },
  {
    title: "AI and Digital Humanities",
    lead: "Bridge humanistic questions with modern AI methods.",
    topics: ["AI-assisted humanities research", "Digital archives", "Cultural and textual data", "Responsible AI"],
    search: "Digital Humanities",
  },
  {
    title: "Corpus linguistics",
    lead: "Design, build, annotate, and analyze research corpora.",
    topics: ["Corpus design", "Annotation", "Concordance and collocation", "Corpus statistics"],
    search: "Corpus",
  },
  {
    title: "Research and data science",
    lead: "Build evidence-driven research from raw data to publication.",
    topics: ["Research design", "Statistics", "Data visualization", "Reproducible analysis"],
    search: "Data",
  },
  {
    title: "App development",
    lead: "Turn research ideas into usable digital tools.",
    topics: ["Research applications", "Web and data apps", "AI agents and workflows", "Interactive research tools"],
    search: "App",
  },
  {
    title: "Professional skills",
    lead: "Connect technical ability with real academic and professional practice.",
    topics: ["AI literacy", "Research communication", "Data management", "Collaborative project skills"],
    search: "Research",
  },
];

function categoryName(course: CourseRow) {
  const category = Array.isArray(course.categories)
    ? course.categories[0]
    : course.categories;

  return String(category?.name || "");
}

function searchableCourseText(course: CourseRow) {
  return [
    course.title,
    course.short_description,
    course.level,
    course.language,
    categoryName(course),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = String(params.q || "").trim();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("id,title,slug,short_description,level,language,cover_url,categories(name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const allCourses = (data || []) as CourseRow[];
  const normalizedQuery = q.toLowerCase();

  const courses = normalizedQuery
    ? allCourses.filter((course) =>
        searchableCourseText(course).includes(normalizedQuery)
      )
    : allCourses;

  return (
    <main className="min-h-screen bg-[#f4f6f8] pb-20 pt-32">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2.25rem] bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.25fr_0.75fr] lg:p-14">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                LexData learning pathways
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                From your first line of code to advanced AI and Digital Humanities research.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Courses for students, researchers, educators, developers, and professionals
                who want to connect coding, language, AI, data, and humanistic inquiry.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Python",
                  "NLP",
                  "AI",
                  "Computational Linguistics",
                  "App Development",
                  "Digital Humanities",
                  "Corpus Linguistics",
                  "Data Science",
                ].map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-black text-slate-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Core promise
              </p>

              <p className="mt-4 text-2xl font-black leading-tight">
                Skills development bridging AI and Digital Humanities across every career stage.
              </p>

              <div className="mt-7 space-y-3 text-sm leading-6 text-slate-300">
                <p>Learn concepts clearly.</p>
                <p>Practice with real research data.</p>
                <p>Build usable tools and workflows.</p>
                <p>Advance from foundation to professional practice.</p>
              </div>

              <a
                href="#published-courses"
                className="mt-7 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                Explore published courses
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Choose your level
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            One learning ecosystem, different starting points.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            You do not need to become a software engineer to use computational methods.
            Start at the level that matches your current work and move forward as your
            research questions become more ambitious.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {learnerLevels.map((level) => (
            <Link
              key={level.label}
              href={`/courses?q=${encodeURIComponent(level.search)}#published-courses`}
              className="group flex min-h-[270px] flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                  Level {level.marker}
                </span>

                <span className="text-xl font-black text-slate-300 transition group-hover:text-blue-600">
                  &rarr;
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black text-slate-950">
                {level.label}
              </h3>

              <p className="mt-2 text-sm font-black leading-5 text-slate-700">
                {level.audience}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {level.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Explore by field
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Build a path across code, language, data, and humanities.
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-600">
            The tracks are intentionally connected. A corpus linguist can learn Python,
            a historian can build an AI-assisted archive workflow, and an NLP researcher
            can move into application development.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topicTracks.map((track, index) => (
            <Link
              key={track.title}
              href={`/courses?q=${encodeURIComponent(track.search)}#published-courses`}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-lg"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Track {String(index + 1).padStart(2, "0")}
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-950 transition group-hover:text-blue-700">
                {track.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {track.lead}
              </p>

              <ul className="mt-5 space-y-2">
                {track.topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex gap-2 text-sm font-bold text-slate-700"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm font-black text-blue-700">
                Find related courses &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-[#dfe8ff] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-800">
                Cross-level progression
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
                Learn a method. Apply it to research. Build with it.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Understand", "Concepts, terminology, computational thinking, and responsible use."],
                ["Practice", "Hands-on notebooks, corpora, datasets, analysis tasks, and guided projects."],
                ["Research", "Turn methods into questions, evidence, reproducible analysis, and publication workflows."],
                ["Build", "Create apps, AI workflows, research tools, datasets, and institution-ready systems."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white/75 p-5"
                >
                  <h3 className="font-black text-slate-950">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="published-courses"
        className="mx-auto mt-16 max-w-7xl px-4 sm:px-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
              Published learning
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Course catalog
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Search by title, topic, category, language, or level.
            </p>
          </div>

          <form className="flex w-full max-w-xl gap-2">
            <input
              name="q"
              defaultValue={q}
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-500 focus:ring-2"
              placeholder="Python, NLP, corpus, advanced..."
            />

            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Search
            </button>

            {q ? (
              <Link
                href="/courses#published-courses"
                className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        {q ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            <strong>Search:</strong>
            <span>{q}</span>
            <span className="ml-auto font-black">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error.message}
          </div>
        ) : null}

        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
            />
          ))}
        </div>

        {!error && courses.length === 0 ? (
          <div className="mt-7 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-xl font-black text-slate-950">
              No matching published course yet
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Try another topic or clear the search. The learning pathways above
              also show the directions LexData is building across AI, language,
              coding, Digital Humanities, and research data science.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
'@

Write-Utf8 $coursesPagePath $coursesPage
Write-Host "[OK] Rebuilt /courses as a multi-level learning pathway." -ForegroundColor Green

$courseCard = @'
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
'@

Write-Utf8 $courseCardPath $courseCard
Write-Host "[OK] Improved course cards." -ForegroundColor Green

Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Running typecheck..." -ForegroundColor Yellow
npm.cmd run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] TypeScript still reports an error. Paste the exact output." -ForegroundColor Red
    Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[OK] Course learning pathways installed." -ForegroundColor Green
Write-Host "Backup: $backupRoot" -ForegroundColor Cyan
Write-Host "No Supabase migration is required." -ForegroundColor Cyan
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Open: http://localhost:3000/courses" -ForegroundColor Cyan
