<<<<<<< HEAD
# LexData Learning Platform MVP

A Coursera/Datawhale-style learning platform customized for LexData.

## Brand content integrated

This version replaces the generic OpenCourse Hub copy with LexData content:

- Brand name: LexData
- Tagline: Intelligent Data Solutions for Language, Translation, Education & Society
- Hero: Bridging Humanities and Data Science for Real-World Impact
- About / mission page
- Services page
- Workshops page
- Contact page
- Payment workflow placeholder page
- LexData-style seed courses in Supabase

## Included features

- Public homepage
- Course catalog with search
- Course intro/detail pages
- Passwordless email login through Supabase Auth
- Student dashboard
- Enrollment system
- Lesson pages protected by enrollment
- Lesson completion progress
- Admin-only course list
- Admin create/edit/delete courses
- Admin add lessons
- Postgres data pool: profiles, categories, courses, lessons, enrollments, progress, announcements, resources
- Row-level security policies

## Platforms needed

1. VS Code — code editor
2. Node.js LTS — local JavaScript runtime
3. GitHub — code repository
4. Supabase — database, login, storage later
5. Vercel — hosting/deployment
6. Domain registrar — Namecheap student, Porkbun, or Cloudflare Registrar

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a Supabase project.
2. Go to SQL Editor.
3. Paste and run `supabase/schema.sql`.
4. Go to Project Settings > API.
5. Copy Project URL and anon public key into `.env.local`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Auth settings

In Supabase Dashboard > Authentication > URL Configuration:

Local:

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Production later:

```text
Site URL: https://yourdomain.com
Redirect URL: https://yourdomain.com/auth/callback
```

## Make yourself admin

1. Login once from `/login`.
2. Open Supabase > Authentication > Users.
3. Copy your user UUID.
4. Run this in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_UUID';
```

Then open `/admin/courses`.

## Admin workflow

- `/admin/courses` — manage courses
- `/admin/courses/new` — create a course
- `/admin/courses/[id]/edit` — edit title, intro, status, cover URL
- `/admin/courses/[id]/lessons` — add lessons
- `/courses` — public course catalog
- `/dashboard` — student enrolled courses

## Where the LexData content is stored

Most reusable company text is centralized here:

```text
lib/site.ts
```

Homepage:

```text
app/page.tsx
```

About page:

```text
app/about/page.tsx
```

Services page:

```text
app/services/page.tsx
```

Workshops page:

```text
app/workshops/page.tsx
```

Contact page:

```text
app/contact/page.tsx
```

Database seed courses:

```text
supabase/schema.sql
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. Go to Vercel and import the repository.
3. Add the same environment variables in Vercel project settings.
4. Deploy.
5. Add the production domain in Vercel Domains.
6. Add the production callback URL in Supabase Auth settings.

## Suggested next upgrades

- Add course category filters
- Add course thumbnails managed through Supabase Storage
- Add rich text editor for lessons
- Add certificate generation
- Add comments/Q&A
- Add payment only after the free MVP works
=======
# lexdata_company_website
this is a github page about the development of official lexdata website
>>>>>>> 134315a3e0213a4067448c9ba428134425f92020
