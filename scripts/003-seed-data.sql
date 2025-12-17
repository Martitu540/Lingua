-- Seed Languages
INSERT INTO languages (code, name, flag_emoji, is_active) VALUES
  ('en', 'English', '🇺🇸', true),
  ('es', 'Spanish', '🇪🇸', true),
  ('fr', 'French', '🇫🇷', true),
  ('de', 'German', '🇩🇪', true),
  ('it', 'Italian', '🇮🇹', true),
  ('pt', 'Portuguese', '🇧🇷', true),
  ('ja', 'Japanese', '🇯🇵', true),
  ('zh', 'Chinese', '🇨🇳', true),
  ('ko', 'Korean', '🇰🇷', true);

-- Seed Courses (Spanish for English speakers as primary)
INSERT INTO courses (source_language_id, target_language_id, title, description, difficulty_level, image_url)
SELECT 
  (SELECT id FROM languages WHERE code = 'en'),
  (SELECT id FROM languages WHERE code = 'es'),
  'Spanish for English Speakers',
  'Learn Spanish from scratch with interactive lessons, AI-powered conversations, and gamified exercises.',
  'beginner',
  '/placeholder.svg?height=200&width=300';

INSERT INTO courses (source_language_id, target_language_id, title, description, difficulty_level, image_url)
SELECT 
  (SELECT id FROM languages WHERE code = 'en'),
  (SELECT id FROM languages WHERE code = 'fr'),
  'French for English Speakers',
  'Master French with our comprehensive course featuring pronunciation guides and cultural insights.',
  'beginner',
  '/placeholder.svg?height=200&width=300';

INSERT INTO courses (source_language_id, target_language_id, title, description, difficulty_level, image_url)
SELECT 
  (SELECT id FROM languages WHERE code = 'en'),
  (SELECT id FROM languages WHERE code = 'de'),
  'German for English Speakers',
  'Learn German efficiently with structured grammar lessons and practical vocabulary.',
  'beginner',
  '/placeholder.svg?height=200&width=300';

INSERT INTO courses (source_language_id, target_language_id, title, description, difficulty_level, image_url)
SELECT 
  (SELECT id FROM languages WHERE code = 'en'),
  (SELECT id FROM languages WHERE code = 'ja'),
  'Japanese for English Speakers',
  'Begin your Japanese journey with hiragana, katakana, and essential kanji.',
  'beginner',
  '/placeholder.svg?height=200&width=300';

-- Seed Units for Spanish Course
INSERT INTO units (course_id, title, description, order_index, icon, theme_color, unlock_xp)
SELECT 
  c.id,
  'Basics 1',
  'Learn essential greetings and introductions',
  1,
  'wave',
  'emerald',
  0
FROM courses c WHERE c.title = 'Spanish for English Speakers';

INSERT INTO units (course_id, title, description, order_index, icon, theme_color, unlock_xp)
SELECT 
  c.id,
  'Basics 2',
  'Common phrases and simple sentences',
  2,
  'message-circle',
  'blue',
  100
FROM courses c WHERE c.title = 'Spanish for English Speakers';

INSERT INTO units (course_id, title, description, order_index, icon, theme_color, unlock_xp)
SELECT 
  c.id,
  'Food & Drinks',
  'Order at restaurants and talk about food',
  3,
  'utensils',
  'orange',
  250
FROM courses c WHERE c.title = 'Spanish for English Speakers';

INSERT INTO units (course_id, title, description, order_index, icon, theme_color, unlock_xp)
SELECT 
  c.id,
  'Travel',
  'Essential phrases for traveling',
  4,
  'plane',
  'sky',
  500
FROM courses c WHERE c.title = 'Spanish for English Speakers';

INSERT INTO units (course_id, title, description, order_index, icon, theme_color, unlock_xp)
SELECT 
  c.id,
  'Family',
  'Talk about family members and relationships',
  5,
  'users',
  'pink',
  800
FROM courses c WHERE c.title = 'Spanish for English Speakers';

-- Seed Lessons for Basics 1 Unit
INSERT INTO lessons (unit_id, title, type, order_index, xp_reward, estimated_minutes)
SELECT 
  u.id,
  'Hello & Goodbye',
  'vocabulary',
  1,
  10,
  5
FROM units u WHERE u.title = 'Basics 1';

INSERT INTO lessons (unit_id, title, type, order_index, xp_reward, estimated_minutes)
SELECT 
  u.id,
  'Nice to Meet You',
  'vocabulary',
  2,
  10,
  5
FROM units u WHERE u.title = 'Basics 1';

INSERT INTO lessons (unit_id, title, type, order_index, xp_reward, estimated_minutes)
SELECT 
  u.id,
  'I Am...',
  'grammar',
  3,
  15,
  7
FROM units u WHERE u.title = 'Basics 1';

INSERT INTO lessons (unit_id, title, type, order_index, xp_reward, estimated_minutes)
SELECT 
  u.id,
  'Numbers 1-10',
  'vocabulary',
  4,
  10,
  5
FROM units u WHERE u.title = 'Basics 1';

INSERT INTO lessons (unit_id, title, type, order_index, xp_reward, estimated_minutes)
SELECT 
  u.id,
  'Practice: Greetings',
  'review',
  5,
  20,
  10
FROM units u WHERE u.title = 'Basics 1';

-- Seed Exercises for "Hello & Goodbye" Lesson
INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'multiple_choice',
  1,
  1,
  '{"question": "How do you say \"Hello\" in Spanish?", "options": ["Hola", "Adiós", "Gracias", "Por favor"], "correct_index": 0}',
  '\"Hola\" is the most common way to say hello in Spanish. It can be used in both formal and informal situations.'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'multiple_choice',
  2,
  1,
  '{"question": "What does \"Adiós\" mean?", "options": ["Hello", "Please", "Goodbye", "Thank you"], "correct_index": 2}',
  '\"Adiós\" means \"Goodbye\" in Spanish. It comes from \"A Dios\" (To God).'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'translation',
  3,
  1,
  '{"prompt": "Translate to Spanish: Good morning", "correct_answers": ["Buenos días", "buenos dias", "Buenos dias"], "hint": "Think about \"good\" + \"days\""}',
  '\"Buenos días\" literally means \"Good days\" but is used to say \"Good morning\" in Spanish.'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'fill_blank',
  4,
  1,
  '{"sentence": "Buenas ___", "blank_index": 1, "correct_answers": ["noches", "tardes"], "hint": "Evening or night greeting", "translation": "Good evening/night"}',
  '\"Buenas noches\" means \"Good night\" and \"Buenas tardes\" means \"Good afternoon/evening\".'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'multiple_choice',
  5,
  2,
  '{"question": "Which greeting would you use at 3 PM?", "options": ["Buenos días", "Buenas tardes", "Buenas noches", "Hasta luego"], "correct_index": 1}',
  '\"Buenas tardes\" is used from around noon until sunset (roughly 12 PM - 8 PM).'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

INSERT INTO exercises (lesson_id, type, order_index, difficulty, content, explanation)
SELECT 
  l.id,
  'drag_drop',
  6,
  2,
  '{"items": ["Hasta", "luego"], "correct_order": [0, 1], "translation": "See you later"}',
  '\"Hasta luego\" is a common way to say \"See you later\" in Spanish. \"Hasta\" means \"until\".'
FROM lessons l WHERE l.title = 'Hello & Goodbye';

-- Seed Achievements
INSERT INTO achievements (key, title, description, icon, xp_reward, criteria) VALUES
  ('first_lesson', 'First Steps', 'Complete your first lesson', 'footprints', 10, '{"type": "lessons_completed", "value": 1}'),
  ('streak_3', 'On Fire', 'Maintain a 3-day streak', 'flame', 25, '{"type": "streak", "value": 3}'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 50, '{"type": "streak", "value": 7}'),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'flame', 200, '{"type": "streak", "value": 30}'),
  ('xp_100', 'Century Club', 'Earn 100 XP', 'star', 10, '{"type": "xp", "value": 100}'),
  ('xp_1000', 'XP Champion', 'Earn 1000 XP', 'trophy', 100, '{"type": "xp", "value": 1000}'),
  ('perfect_lesson', 'Perfectionist', 'Complete a lesson with no mistakes', 'check-circle', 15, '{"type": "perfect_lesson", "value": 1}'),
  ('night_owl', 'Night Owl', 'Complete a lesson after 10 PM', 'moon', 10, '{"type": "time", "value": "night"}'),
  ('early_bird', 'Early Bird', 'Complete a lesson before 7 AM', 'sunrise', 10, '{"type": "time", "value": "morning"}'),
  ('ai_chat_first', 'Conversation Starter', 'Have your first AI conversation', 'message-square', 20, '{"type": "ai_chat", "value": 1}');

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
