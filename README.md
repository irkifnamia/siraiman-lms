# SIR AIMAN LMS

Mobile-first learning management app for Sir Aiman's mathematics classes (Kolej Matrikulasi Kedah, 2026/2027 Sem 2).

**Stack:** Next.js 15 (App Router, Server Actions) · Neon Postgres · Google Drive (file storage) · Vercel · Tailwind v4

## Features
- **Students database** – classes F3T1, H7T5, J1T2; SPM/DM grades; search, filter, add/edit, CSV import/export
- **Announcements** – per class or all, pinning
- **Learning plan** – weekly topics with status (planned / ongoing / done)
- **Tasks & submission** – tutorials, quizzes, assignments; upload to Drive or paste a link; resubmit until marked
- **Mark & return** – per-student mark + feedback, bulk return, paper submissions, CSV export
- **Gradebook** – class × task matrix with averages
- **Attendance** – P / L / A / E per session with history
- **Resources** – notes, slides, past papers, videos
- **Student portal** – home, tasks, plan, marks, attendance, PIN change

## Login
- Lecturer: password in `ADMIN_PASSWORD`
- Student: matric number + PIN (default = last 4 digits of matric)

## Environment
See `.env.example`. Schema is in `db/schema.sql`.

## Google Drive (optional)
Create an OAuth Web client (scope `drive.file`), redirect URI `https://<app>/api/google/callback`, set
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, then Admin → Settings → Connect Google Drive.
