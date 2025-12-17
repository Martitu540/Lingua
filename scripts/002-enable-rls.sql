-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Courses: Users can only access their own courses
CREATE POLICY "Users can view own courses" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

-- User Lesson Progress: Users can only access their own progress
CREATE POLICY "Users can view own progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- User Exercise History: Users can only access their own history
CREATE POLICY "Users can view own history" ON user_exercise_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON user_exercise_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Achievements: Users can only access their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Goals: Users can only access their own goals
CREATE POLICY "Users can view own goals" ON daily_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON daily_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON daily_goals FOR UPDATE USING (auth.uid() = user_id);

-- AI Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for courses, languages, units, lessons, exercises, achievements
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Anyone can view units" ON units FOR SELECT USING (true);
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
