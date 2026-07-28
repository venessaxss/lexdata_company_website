# Workshop-wise management patch

This changes the admin workshop workflow to:

- `/admin/workshops`: workshop index only
- `/admin/workshops/[id]`: one complete workshop workspace

Each workshop workspace includes:

- overview and publication settings
- recruitment and process status
- major session creation and editing
- subsession creation and editing
- date and time fields
- live, recording, and material links
- session and subsession move-up/move-down arrangement
- shortcuts to the public page, live room, and registrations

No Supabase migration is included because this patch uses the existing
`workshops`, `workshop_sessions`, and `workshop_subsessions` fields already
used by the current LexData workshop manager.
