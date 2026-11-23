-- SIR AIMAN LMS schema (Neon Postgres)

CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,          -- e.g. 2026-2027 SEM 2
  is_current BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS classes (
  code TEXT PRIMARY KEY,              -- e.g. F3T1
  semester_id INT REFERENCES semesters(id),
  subject TEXT DEFAULT 'Mathematics',
  schedule TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  matric TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  class_code TEXT REFERENCES classes(code) ON UPDATE CASCADE,
  system TEXT,                        -- SDS / SES
  spm_addmath TEXT,
  spm_math TEXT,
  dm015 TEXT,
  dm025 TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  pin_hash TEXT,                      -- null = default PIN (last 4 of matric)
  active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  class_code TEXT,                    -- null = all classes
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_plan (
  id SERIAL PRIMARY KEY,
  week INT NOT NULL,
  start_date DATE,
  topic TEXT NOT NULL,
  subtopics TEXT,
  objectives TEXT,
  activities TEXT,
  resource_url TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- planned / ongoing / done
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'Tutorial', -- Tutorial / Quiz / Assignment / Project
  class_code TEXT,                    -- null = all classes
  due_at TIMESTAMPTZ,
  max_mark NUMERIC NOT NULL DEFAULT 100,
  attachment_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted / returned
  mark NUMERIC,
  feedback TEXT,
  returned_at TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  class_code TEXT NOT NULL,
  session_date DATE NOT NULL,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'P',   -- P present, A absent, L late, E excused
  UNIQUE (session_date, student_id, class_code)
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'Notes',
  class_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_sub_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sub_student ON submissions(student_id);
