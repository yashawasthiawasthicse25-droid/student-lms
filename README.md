# EduPulse - Student Learning Management System (LMS)

A complete, full-stack **Student Learning Management System** built with **HTML5, CSS3, Vanilla JavaScript, Node.js/Express, and SQLite** (`node:sqlite`).

This project satisfies all three iterative versions:
- **Version 1 (HTML & CSS)**: Semantic structure, responsive layouts, design tokens, and five dedicated pages.
- **Version 2 (JavaScript)**: Real-time course search, multi-subject & difficulty filtering, interactive lesson completion tracking, dynamic progress percentage calculations, and an interactive quiz engine.
- **Version 3 (Backend & Database)**: User authentication (registration/login), password hashing, persistent SQLite database storage for courses, enrollments, completions, and quizzes, plus a comprehensive Teacher/Admin dashboard.

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js** v22.5.0 or higher (Tested on Node v24.19.0).
- Uses Node's built-in `node:sqlite` and `node:crypto` modules — no native compilation tools required!

### 2. Installation & Launch
```bash
# Navigate to project directory
cd student-lms

# Start the server (runs on port 3000)
npm start
# or: node server.js
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

### Contact Email Delivery
Contact form messages are saved in SQLite and sent to `awasthishiv255@gmail.com` when SMTP is configured. If SMTP is unavailable, the form opens a prefilled Gmail compose window addressed to the same inbox. Set these environment variables before starting the server to enable automatic delivery:

```text
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=your-verified-sender@example.com
CONTACT_EMAIL=awasthishiv255@gmail.com
```

Use your mail provider's SMTP host and an app-specific password where applicable. Visitors can also open Gmail directly from the Academic Support link on the Contact page.

---

## 🔑 Pre-Configured Demo Accounts

For immediate testing, the database is auto-seeded with test accounts:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `student@example.com` | `password123` | Enrolled courses, lesson completion tracking, quiz history, profile editing. |
| **Teacher / Admin** | `admin@example.com` | `admin123` | Faculty overview, platform KPI metrics, student progress tracking, course authoring. |

*(Quick 1-Click buttons are also provided directly on the Login page for seamless evaluation!)*

---

## 📋 Comprehensive Feature Breakdown

### 🎨 Version 1: HTML & CSS
1. **Home Page (`index.html`)**:
   - Hero banner with badge, value proposition, and call-to-action buttons.
   - Platform KPI counters and featured learning track preview card.
   - Core capabilities grid with responsive card hover elevations.
   - Clean, accessible semantic hierarchy (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
2. **Course Listing Page (`courses.html`)**:
   - Responsive multi-column CSS Grid layout (`minmax(330px, 1fr)`).
   - Rich card metadata: difficulty level, instructor, duration, lesson count, quiz count.
   - Inline progress bars for currently enrolled courses.
3. **Course Detail Page (`course-detail.html`)**:
   - High-contrast hero banner customized with course subject themes.
   - Lesson-specific YouTube searches and recommended educator channels, opening lectures directly on YouTube to avoid blocked or restricted embedded players.
   - Sticky syllabus curriculum accordion with numbered modules.
4. **Student Profile Page (`profile.html`)**:
   - Student identity card with avatar initials, role badge, and editable bio.
   - Summary metric tiles: Total Enrolled, Completed Courses, Lessons Done, Average Quiz Score.
   - List of enrolled courses with live percentage meters and "Resume Learning" buttons.
5. **Contact Page (`contact.html`)**:
   - Accessible contact form with structured inputs and subject taxonomy dropdown.
   - Campus advising details and office hours.
   - Native collapsible FAQ accordion using `<details>` and `<summary>`.

---

### ⚡ Version 2: JavaScript
1. **Real-Time Course Search**:
   - Live text search filtering across course titles, descriptions, subjects, and instructor names.
2. **Multi-Dimension Filtering**:
   - Subject pills: *All Subjects*, *Web Development*, *Computer Science*, *Data Science*, *Mathematics*.
   - Level dropdown: *Beginner*, *Intermediate*, *Advanced*.
   - Live counter updating available matches.
3. **Mark Lessons as Completed**:
   - Interactive checkbox on each lesson item in the syllabus.
   - Strikethrough styling and completed badge updates.
4. **Dynamic Progress Percentage**:
   - Automatically recalculates `(completed_lessons / total_lessons) * 100`.
   - Real-time animated CSS progress bar fill and percentage badge.
5. **Interactive Quiz Engine**:
   - Renders multiple-choice questions for each course.
   - User answer selection with visual radio card highlights.
   - Instant score calculation upon submission (`score / total_questions`).
   - Diagnostic feedback: green highlight for correct answers, red for incorrect, plus rationales and explanations.
   - Pass banner (>= 70%) or encouragement to retake.
   - At least five course-specific assessment questions per seeded course, with server-side grading and explanations.

---

### 🗄️ Version 3: Backend & Database
1. **REST API (`server.js`)**:
   - `POST /api/auth/register` & `POST /api/auth/login` (Secure password hashing via `node:crypto` scrypt).
   - `GET /api/courses` & `GET /api/courses/:id` (Rich course and curriculum queries).
   - `POST /api/courses/:id/enroll` (Student enrollment).
   - `POST /api/courses/:id/lessons/:lessonId/toggle` (Toggle lesson completion).
   - `POST /api/courses/:id/quiz/submit` (Evaluate answers and record attempt).
   - `GET /api/student/dashboard` & `PUT /api/student/profile` (Student analytics & bio update).
   - `GET /api/admin/overview` & `GET /api/admin/students` (Teacher management metrics).
   - `POST /api/admin/courses` (Teacher course creation).
   - `POST /api/contact` (Contact inquiry logging).
2. **SQLite Database (`db/database.js`)**:
   - Zero-dependency embedded database via Node 22+ `node:sqlite`.
   - Relational tables: `users`, `courses`, `lessons`, `quizzes`, `enrollments`, `lesson_completions`, `quiz_attempts`, `contact_messages`.
   - Foreign key constraints with cascading deletes.
3. **Teacher / Admin Dashboard (`admin.html`)**:
   - KPI metrics: Total Students, Total Courses, Total Enrollments, Lessons Completed, Avg Quiz Score.
   - Managed Courses table with enrollment counters.
   - Student Learning Progress tracker showing individual lesson completion percentages.
   - "Author New Course" modal form with immediate database insertion.

---

## 📂 Project Structure

```
student-lms/
├── package.json               # Express dependency and start scripts
├── server.js                  # Express REST API, auth middleware & static router
├── README.md                  # Complete project documentation
├── db/
│   ├── database.js            # SQLite initialization, schema DDL & seed data
│   └── lms.sqlite             # Auto-generated SQLite database
└── public/
    ├── css/
    │   └── style.css          # Design system, CSS variables & responsive layout
    ├── js/
    │   ├── api.js             # API client, token handling & toast alerts
    │   ├── auth.js            # Sign in, registration & quick demo switchers
    │   ├── courses.js         # Real-time search, subject & level filtering
    │   ├── course-detail.js   # Syllabus checklist, progress calc & quiz engine
    │   ├── profile.js         # Student dashboard, analytics & bio editor
    │   ├── admin.js           # Teacher dashboard, student tracking & course creator
    │   └── contact.js         # Form validation & inquiry submission
    ├── index.html             # V1: Home Page
    ├── courses.html           # V1 & V2: Course Listing with search & filter
    ├── course-detail.html     # V1, V2, V3: Detail, lesson tracker & quiz engine
    ├── profile.html           # V1 & V3: Student learning profile
    ├── contact.html           # V1 & V3: Contact & academic advising
    ├── login.html             # V3: Authentication & Registration
    └── admin.html             # V3: Teacher & Admin Dashboard
```
