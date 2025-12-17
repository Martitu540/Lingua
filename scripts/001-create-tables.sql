-- USERS PROFILE (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  display_name VARCHAR(100),
  avatar_url TEXT,
  native_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  streak_count INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,
  daily_xp_goal INT DEFAULT 50,
  hearts INT DEFAULT 5,
  last_heart_refresh TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

-- LANGUAGES
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  flag_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE
);

-- COURSES
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_language_id UUID REFERENCES languages(id),
  target_language_id UUID REFERENCES languages(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(20),
  is_premium BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_language_id, target_language_id)
);

-- UNITS
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  icon VARCHAR(50),
  theme_color VARCHAR(20),
  unlock_xp INT DEFAULT 0
);

-- LESSONS
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  type VARCHAR(30),
  order_index INT NOT NULL,
  xp_reward INT DEFAULT 10,
  estimated_minutes INT DEFAULT 5,
  is_premium BOOLEAN DEFAULT FALSE
);

-- EXERCISES
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  order_index INT NOT NULL,
  difficulty INT DEFAULT 1,
  content JSONB NOT NULL,
  hints JSONB,
  explanation TEXT,
  audio_url TEXT,
  image_url TEXT
);

-- USER COURSES
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  last_practiced_at TIMESTAMP,
  current_unit_id UUID REFERENCES units(id),
  UNIQUE(user_id, course_id)
);

-- USER LESSON PROGRESS
CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'locked',
  score INT,
  attempts INT DEFAULT 0,
  completed_at TIMESTAMP,
  last_attempted_at TIMESTAMP,
  mistakes_count INT DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- USER EXERCISE HISTORY
CREATE TABLE user_exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  user_answer JSONB,
  time_spent_seconds INT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  xp_reward INT DEFAULT 0,
  criteria JSONB
);

-- USER ACHIEVEMENTS
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- DAILY GOALS
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  xp_goal INT DEFAULT 50,
  xp_earned INT DEFAULT 0,
  lessons_goal INT DEFAULT 3,
  lessons_completed INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, date)
);

-- AI CONVERSATIONS
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  type VARCHAR(30),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  messages JSONB DEFAULT '[]'
);

-- INDEXES
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_exercise_history_user ON user_exercise_history(user_id);
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX idx_lessons_unit ON lessons(unit_id);
CREATE INDEX idx_units_course ON units(course_id);
