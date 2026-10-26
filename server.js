const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const { db, initDb, hashPassword, verifyPassword } = require('./db/database.js');

// Initialize database schema and seed data
initDb();

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'lms-super-secret-key-2026';
const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL || 'awasthishiv255@gmail.com';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Simple stateless signed auth token
function createToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Authentication middleware
function authMiddleware(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = db.prepare('SELECT id, name, email, role, bio, avatar_url FROM users WHERE id = ?').get(payload.userId);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Requires ${role} privileges.` });
    }
    next();
  };
}

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    let videoId = null;
    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1);
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/')[2];
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function createContactTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

function createGmailComposeUrl({ to = CONTACT_RECIPIENT, subject = '', body = '' } = {}) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function createContactEmailDraft({ name, email, subject, message }) {
  const body = `From: ${name}\nEmail: ${email}\n\n${message}`;
  return createGmailComposeUrl({
    subject: `[EduPulse] ${subject}`,
    body
  });
}

app.use(authMiddleware);

// ==========================================
// 1. AUTHENTICATION ENDPOINTS (Version 3)
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role = 'student', bio = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role === 'admin' ? 'admin' : 'student',
      bio,
      initials
    );

    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role === 'admin' ? 'admin' : 'student',
      bio,
      avatar_url: initials
    };

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ message: 'Registration successful!', user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed due to internal error.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar_url: user.avatar_url
    };

    res.json({ message: 'Login successful!', user: userSafe, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to internal error.' });
  }
});

// Current user
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.user });
});

// Logout (stateless confirmation)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

// ==========================================
// 2. COURSES ENDPOINTS (Version 1 & 2 & 3)
// ==========================================

// List courses with filter & search
app.get('/api/courses', (req, res) => {
  try {
    const { search = '', subject = '', level = '' } = req.query;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (search.trim()) {
      query += ' AND (title LIKE ? OR description LIKE ? OR instructor LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (subject.trim() && subject.toLowerCase() !== 'all') {
      query += ' AND subject = ?';
      params.push(subject.trim());
    }

    if (level.trim() && level.toLowerCase() !== 'all') {
      query += ' AND level = ?';
      params.push(level.trim());
    }

    query += ' ORDER BY id ASC';

    const courses = db.prepare(query).all(...params);

    // Calculate lesson counts and user progress for each course
    const enriched = courses.map(course => {
      const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(course.id).count;
      const quizCount = db.prepare('SELECT COUNT(*) as count FROM quizzes WHERE course_id = ?').get(course.id).count;
      
      let isEnrolled = false;
      let completedLessons = 0;
      let progressPercent = 0;

      if (req.user) {
        const enrollment = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
        isEnrolled = !!enrollment;

        if (isEnrolled) {
          completedLessons = db.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = ? AND course_id = ?')
            .get(req.user.id, course.id).count;
          progressPercent = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;
        }
      }

      return {
        ...course,
        lesson_count: lessonCount,
        quiz_count: quizCount,
        is_enrolled: isEnrolled,
        completed_lessons: completedLessons,
        progress_percentage: progressPercent
      };
    });

    res.json({ courses: enriched });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// Course detail by ID or Slug
app.get('/api/courses/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let course;
    if (/^\d+$/.test(idOrSlug)) {
      course = db.prepare('SELECT * FROM courses WHERE id = ?').get(Number(idOrSlug));
    } else {
      course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(idOrSlug);
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Fetch lessons ordered
    const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_num ASC').all(course.id);

    // Fetch quizzes
    const rawQuizzes = db.prepare('SELECT id, question, options_json, explanation FROM quizzes WHERE course_id = ?').all(course.id);
    const quizzes = rawQuizzes.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options_json),
      explanation: q.explanation
    }));

    // If user is authenticated, retrieve completion state
    let completedLessonIds = [];
    let isEnrolled = false;
    let quizAttempts = [];

    if (req.user) {
      const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
      isEnrolled = !!enrollment;

      const comps = db.prepare('SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND course_id = ?').all(req.user.id, course.id);
      completedLessonIds = comps.map(c => c.lesson_id);

      quizAttempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? AND course_id = ? ORDER BY attempted_at DESC').all(req.user.id, course.id);
    }

    const totalLessons = lessons.length;
    const completedCount = completedLessonIds.length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      course: {
        ...course,
        lessons: lessons.map(l => ({
          ...l,
          completed: completedLessonIds.includes(l.id)
        })),
        quizzes,
        is_enrolled: isEnrolled,
        completed_lessons: completedCount,
        total_lessons: totalLessons,
        progress_percentage: progressPercentage,
        quiz_attempts: quizAttempts
      }
    });
  } catch (err) {
    console.error('Error fetching course detail:', err);
    res.status(500).json({ error: 'Failed to retrieve course detail.' });
  }
});

// Enroll in a course
app.post('/api/courses/:id/enroll', requireAuth, (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = db.prepare('SELECT id, title FROM courses WHERE id = ?').get(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, courseId);
    if (existing) {
      return res.json({ message: 'Already enrolled in this course!', alreadyEnrolled: true });
    }

    db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, courseId);
    res.json({ message: `Successfully enrolled in ${course.title}!`, success: true });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Enrollment failed.' });
  }
});

// Mark / Unmark lesson completion (Version 2 & 3)
app.post('/api/courses/:id/lessons/:lessonId/toggle', requireAuth, (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const lessonId = Number(req.params.lessonId);

    // Auto-enroll if not already
    const enrollment = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, courseId);
    if (!enrollment) {
      db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, courseId);
    }

    const existing = db.prepare('SELECT id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?').get(req.user.id, lessonId);

    let completed = false;
    if (existing) {
      // Toggle off
      db.prepare('DELETE FROM lesson_completions WHERE id = ?').run(existing.id);
      completed = false;
    } else {
      // Toggle on
      db.prepare('INSERT INTO lesson_completions (user_id, course_id, lesson_id) VALUES (?, ?, ?)').run(req.user.id, courseId, lessonId);
      completed = true;
    }

    // Recalculate course progress
    const totalLessons = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(courseId).count;
    const completedCount = db.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = ? AND course_id = ?')
      .get(req.user.id, courseId).count;
    const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      lessonId,
      completed,
      completedCount,
      totalLessons,
      progressPercentage,
      message: completed ? 'Lesson completed!' : 'Lesson marked incomplete.'
    });
  } catch (err) {
    console.error('Toggle lesson error:', err);
    res.status(500).json({ error: 'Failed to update lesson completion.' });
  }
});

// Submit Quiz answers and calculate score (Version 2 & 3)
app.post('/api/courses/:id/quiz/submit', requireAuth, (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { answers } = req.body; // e.g. { quizId: selectedOptionIndex }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Quiz answers are required.' });
    }

    const quizzes = db.prepare('SELECT id, question, options_json, correct_index, explanation FROM quizzes WHERE course_id = ?').all(courseId);
    if (quizzes.length === 0) {
      return res.status(400).json({ error: 'No quizzes found for this course.' });
    }

    let score = 0;
    const results = quizzes.map(q => {
      const selectedIndex = answers[q.id] !== undefined ? Number(answers[q.id]) : -1;
      const isCorrect = selectedIndex === q.correct_index;
      if (isCorrect) score++;

      return {
        quiz_id: q.id,
        question: q.question,
        options: JSON.parse(q.options_json),
        selected_index: selectedIndex,
        correct_index: q.correct_index,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = quizzes.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Save attempt in database
    db.prepare(`
      INSERT INTO quiz_attempts (user_id, course_id, score, total_questions, percentage)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, courseId, score, totalQuestions, percentage);

    res.json({
      score,
      total_questions: totalQuestions,
      percentage,
      passed: percentage >= 70,
      results
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to evaluate quiz submission.' });
  }
});

// ==========================================
// 3. STUDENT PROFILE & DASHBOARD (Version 1 & 3)
// ==========================================
app.get('/api/student/dashboard', requireAuth, (req, res) => {
  try {
    const enrolledCourses = db.prepare(`
      SELECT c.*, e.enrolled_at
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user.id);

    const detailedCourses = enrolledCourses.map(course => {
      const totalLessons = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(course.id).count;
      const completedLessons = db.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = ? AND course_id = ?')
        .get(req.user.id, course.id).count;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const latestQuiz = db.prepare(`
        SELECT score, total_questions, percentage, attempted_at
        FROM quiz_attempts
        WHERE user_id = ? AND course_id = ?
        ORDER BY attempted_at DESC LIMIT 1
      `).get(req.user.id, course.id);

      return {
        ...course,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: progressPercentage,
        latest_quiz: latestQuiz || null,
        is_completed: progressPercentage === 100
      };
    });

    // Summary calculations
    const totalEnrolled = detailedCourses.length;
    const totalCompletedCourses = detailedCourses.filter(c => c.is_completed).length;
    const totalLessonsFinished = db.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = ?').get(req.user.id).count;
    
    const quizStats = db.prepare(`
      SELECT COUNT(*) as total_attempts, AVG(percentage) as avg_score
      FROM quiz_attempts
      WHERE user_id = ?
    `).get(req.user.id);

    res.json({
      user: req.user,
      courses: detailedCourses,
      stats: {
        total_enrolled: totalEnrolled,
        total_completed_courses: totalCompletedCourses,
        total_lessons_finished: totalLessonsFinished,
        total_quiz_attempts: quizStats.total_attempts || 0,
        average_quiz_score: quizStats.avg_score ? Math.round(quizStats.avg_score) : 0
      }
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve student profile dashboard.' });
  }
});

// Update student profile info
app.put('/api/student/profile', requireAuth, (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    db.prepare('UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?').run(
      name.trim(),
      bio || '',
      initials,
      req.user.id
    );

    const updated = db.prepare('SELECT id, name, email, role, bio, avatar_url FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully!', user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==========================================
// 4. TEACHER / ADMIN DASHBOARD (Version 3)
// ==========================================
app.get('/api/admin/overview', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const totalEnrollments = db.prepare('SELECT COUNT(*) as count FROM enrollments').get().count;
    const totalCompletions = db.prepare('SELECT COUNT(*) as count FROM lesson_completions').get().count;
    const quizStats = db.prepare('SELECT COUNT(*) as attempts, AVG(percentage) as avg_score FROM quiz_attempts').get();

    // Recent student enrollments with course details
    const recentEnrollments = db.prepare(`
      SELECT e.id, u.name as student_name, u.email as student_email, c.title as course_title, e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrolled_at DESC
      LIMIT 10
    `).all();

    // Courses with student counts
    const coursesStats = db.prepare(`
      SELECT c.id, c.title, c.subject, c.level, c.instructor,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count,
             (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
             (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count
      FROM courses c
      ORDER BY student_count DESC
    `).all();

    res.json({
      metrics: {
        total_students: totalStudents,
        total_courses: totalCourses,
        total_enrollments: totalEnrollments,
        total_lessons_completed: totalCompletions,
        total_quiz_attempts: quizStats.attempts || 0,
        average_quiz_score: quizStats.avg_score ? Math.round(quizStats.avg_score) : 0
      },
      recent_enrollments: recentEnrollments,
      courses: coursesStats
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch admin overview.' });
  }
});

// Admin: Get all students and their detailed progress
app.get('/api/admin/students', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const students = db.prepare("SELECT id, name, email, bio, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC").all();

    const enrichedStudents = students.map(student => {
      const enrollments = db.prepare(`
        SELECT c.id, c.title,
               (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
               (SELECT COUNT(*) FROM lesson_completions WHERE user_id = ? AND course_id = c.id) as completed_lessons
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
      `).all(student.id, student.id);

      const quizCount = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?').get(student.id).count;

      return {
        ...student,
        enrolled_courses: enrollments.map(e => ({
          ...e,
          progress_percent: e.total_lessons > 0 ? Math.round((e.completed_lessons / e.total_lessons) * 100) : 0
        })),
        total_quiz_attempts: quizCount
      };
    });

    res.json({ students: enrichedStudents });
  } catch (err) {
    console.error('Admin students error:', err);
    res.status(500).json({ error: 'Failed to fetch students list.' });
  }
});

// Admin: Create course with lessons & quizzes
app.post('/api/admin/courses', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { title, subject, level, description, instructor, duration, lessons = [], quizzes = [] } = req.body;

    if (!title || !subject || !description || !instructor) {
      return res.status(400).json({ error: 'Title, subject, description, and instructor are required.' });
    }

    const lessonList = Array.isArray(lessons) ? lessons : [];
    for (const lesson of lessonList) {
      if (lesson.video_url && !getYouTubeVideoId(lesson.video_url)) {
        return res.status(400).json({ error: 'Lesson video URLs must link to a valid YouTube video.' });
      }
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const courseRes = db.prepare(`
      INSERT INTO courses (title, slug, subject, level, description, instructor, duration, badge, image_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?)
    `).run(
      title.trim(),
      slug,
      subject.trim(),
      level || 'Beginner',
      description.trim(),
      instructor.trim(),
      duration || '4 Weeks',
      randomColor
    );

    const courseId = Number(courseRes.lastInsertRowid);

    // Insert lessons if provided
    const insertLesson = db.prepare(`
      INSERT INTO lessons (course_id, title, order_num, duration, summary, content, video_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    if (lessonList.length > 0) {
      lessonList.forEach((l, idx) => {
        insertLesson.run(
          courseId,
          l.title || `Lesson ${idx + 1}`,
          idx + 1,
          l.duration || '30 min',
          l.summary || '',
          l.content || 'Content coming soon.',
          l.video_url ? `https://www.youtube.com/watch?v=${getYouTubeVideoId(l.video_url)}` : null
        );
      });
    } else {
      // Default welcome lesson
      insertLesson.run(
        courseId,
        'Introduction & Syllabus Overview',
        1,
        '20 min',
        'Course roadmap and orientation.',
        'Welcome to ' + title + '! In this lesson we establish foundations and review core milestones.',
        null
      );
    }

    // Insert quizzes if provided
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      const insertQuiz = db.prepare(`
        INSERT INTO quizzes (course_id, question, options_json, correct_index, explanation)
        VALUES (?, ?, ?, ?, ?)
      `);
      quizzes.forEach(q => {
        insertQuiz.run(
          courseId,
          q.question,
          JSON.stringify(q.options || ['Option A', 'Option B']),
          q.correct_index || 0,
          q.explanation || ''
        );
      });
    }

    res.status(201).json({ message: 'Course created successfully!', courseId, slug });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// ==========================================
// 5. CONTACT FORM ENDPOINT (Version 1 & 3)
// ==========================================
app.get('/api/contact/config', (req, res) => {
  res.json({ email: CONTACT_RECIPIENT });
});

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields (Name, Email, Subject, Message) are required.' });
    }

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const transport = createContactTransport();
    const result = db.prepare(`
      INSERT INTO contact_messages (name, email, subject, message, email_delivery_status)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim(), subject.trim(), message.trim(), transport ? 'pending' : 'not_configured');

    if (!transport) {
      return res.json({
        success: true,
        emailSent: false,
        message: 'Your message is saved. Email is not configured on this server; open the prepared email draft below to send it.',
        emailDraftUrl: createContactEmailDraft({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
      });
    }

    transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: CONTACT_RECIPIENT,
      replyTo: email.trim(),
      subject: `[EduPulse] ${subject.trim()}`,
      text: `From: ${name.trim()} <${email.trim()}>\nSubject: ${subject.trim()}\n\n${message.trim()}`
    }).then(() => {
      db.prepare("UPDATE contact_messages SET email_delivery_status = 'sent' WHERE id = ?").run(result.lastInsertRowid);
      res.json({
        success: true,
        message: `Thank you! Your message has been emailed to ${CONTACT_RECIPIENT}.`
      });
    }).catch(err => {
      console.error('Contact email delivery error:', err.message);
      db.prepare("UPDATE contact_messages SET email_delivery_status = 'failed' WHERE id = ?").run(result.lastInsertRowid);
      res.json({
        success: true,
        emailSent: false,
        message: 'Your message is saved, but server email delivery failed. Open the prepared email draft below to send it.',
        emailDraftUrl: createContactEmailDraft({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
      });
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to submit message.' });
  }
});

// Admin: View contact messages
app.get('/api/admin/messages', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    res.json({ messages });
  } catch (err) {
    console.error('Admin messages error:', err);
    res.status(500).json({ error: 'Failed to fetch contact inquiries.' });
  }
});

// Fallback to index.html for root or SPA paths
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Student Learning Management System (LMS) Server `);
  console.log(`=================================================`);
  console.log(` Local URL : http://localhost:${PORT}`);
  console.log(` Default Student Account: student@example.com / password123`);
  console.log(` Default Admin Account  : admin@example.com   / admin123`);
  console.log(` Database: SQLite (Embedded node:sqlite)`);
  console.log(` Status: Running and ready!`);
});
