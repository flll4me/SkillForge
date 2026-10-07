CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  skill_id BIGINT NOT NULL REFERENCES skills(id),
  text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE')),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS interviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  skill_id BIGINT NOT NULL REFERENCES skills(id),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  score NUMERIC(5, 2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE interview_questions RENAME TO interview_question_prompts;

CREATE TABLE IF NOT EXISTS interview_questions (
  id BIGSERIAL PRIMARY KEY,
  interview_id BIGINT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id),
  question_order INTEGER NOT NULL CHECK (question_order > 0),
  UNIQUE (interview_id, question_order),
  UNIQUE (interview_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_answers (
  id BIGSERIAL PRIMARY KEY,
  interview_question_id BIGINT NOT NULL UNIQUE
    REFERENCES interview_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_answer_options (
  id BIGSERIAL PRIMARY KEY,
  user_answer_id BIGINT NOT NULL REFERENCES user_answers(id) ON DELETE CASCADE,
  question_option_id BIGINT NOT NULL REFERENCES question_options(id),
  UNIQUE (user_answer_id, question_option_id)
);

CREATE TABLE IF NOT EXISTS user_skills (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id),
  score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  completed_interviews INTEGER NOT NULL DEFAULT 0 CHECK (completed_interviews >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_skill_difficulty
  ON questions (skill_id, difficulty) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_interviews_user_started
  ON interviews (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_order
  ON interview_questions (interview_id, question_order);

INSERT INTO skills (name, description)
VALUES
  ('JavaScript', 'Язык программирования для веб-разработки.'),
  ('TypeScript', 'JavaScript с проверкой типов.'),
  ('React', 'Библиотека для создания пользовательских интерфейсов.'),
  ('Node.js', 'Среда выполнения JavaScript на сервере.'),
  ('HTML', 'Язык разметки веб-страниц.'),
  ('CSS', 'Язык оформления веб-страниц.'),
  ('SQL', 'Язык запросов к реляционным базам данных.'),
  ('Git', 'Система контроля версий.')
ON CONFLICT (name) DO NOTHING;
