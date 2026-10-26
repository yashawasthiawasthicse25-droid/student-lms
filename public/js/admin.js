// Version 3: Teacher / Admin Dashboard
let adminOverview = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminDashboard();
});

async function loadAdminDashboard() {
  const user = API.getUser();
  if (!user || user.role !== 'admin') {
    document.getElementById('admin-content').innerHTML = `
      <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h2 style="font-size: 1.6rem; color: var(--danger); margin-bottom: 0.75rem;">Teacher / Administrator Access Only</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">You must be signed in with faculty/instructor credentials to access the analytics and course management portal.</p>
        <button class="btn btn-primary" onclick="adminQuickLogin()">Log in as Faculty (Dr. Sarah Chen)</button>
      </div>
    `;
    return;
  }

  try {
    const overview = await API.getAdminOverview();
    adminOverview = overview;
    renderMetrics(overview.metrics);
    renderCoursesTable(overview.courses);
    renderRecentEnrollments(overview.recent_enrollments);
    await loadStudentsTable();
  } catch (err) {
    console.error('Failed to load admin dashboard:', err);
    showToast('Failed to load instructor dashboard.', 'error');
  }
}

async function adminQuickLogin() {
  try {
    await API.login('admin@example.com', 'admin123');
    window.location.reload();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderMetrics(m) {
  document.getElementById('metric-students').textContent = m.total_students;
  document.getElementById('metric-courses').textContent = m.total_courses;
  document.getElementById('metric-enrollments').textContent = m.total_enrollments;
  document.getElementById('metric-lessons-done').textContent = m.total_lessons_completed;
  document.getElementById('metric-quiz-avg').textContent = `${m.average_quiz_score}%`;
}

function renderCoursesTable(courses) {
  const tbody = document.getElementById('admin-courses-tbody');
  if (!tbody) return;

  tbody.innerHTML = courses.map(c => `
    <tr>
      <td><strong>${c.title}</strong></td>
      <td><span class="badge badge-primary">${c.subject}</span></td>
      <td>${c.level}</td>
      <td>${c.instructor}</td>
      <td>${c.student_count} Students</td>
      <td>${c.lesson_count} Lessons / ${c.quiz_count} Quizzes</td>
      <td>
        <a href="/course-detail.html?id=${c.id}" class="btn btn-outline btn-sm">Preview</a>
      </td>
    </tr>
  `).join('');
}

function renderRecentEnrollments(enrollments) {
  const tbody = document.getElementById('admin-enrollments-tbody');
  if (!tbody) return;

  if (enrollments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No enrollments logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = enrollments.map(e => `
    <tr>
      <td><strong>${e.student_name}</strong><br><small style="color: var(--text-muted);">${e.student_email}</small></td>
      <td>${e.course_title}</td>
      <td>${new Date(e.enrolled_at).toLocaleString()}</td>
      <td><span class="badge badge-success">Active</span></td>
    </tr>
  `).join('');
}

async function loadStudentsTable() {
  const tbody = document.getElementById('admin-students-tbody');
  if (!tbody) return;

  try {
    const res = await API.getAdminStudents();
    const students = res.students || [];

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No students registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const coursesSummary = s.enrolled_courses.map(c => 
        `<div><strong>${c.title}</strong>: ${c.completed_lessons}/${c.total_lessons} lessons (${c.progress_percent}%)</div>`
      ).join('') || '<span style="color: var(--text-muted);">No courses yet</span>';

      return `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.email}</td>
          <td>${coursesSummary}</td>
          <td>${s.total_quiz_attempts} Attempts</td>
          <td>${new Date(s.created_at).toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load students:', err);
  }
}

// Modal: Create Course
function openCreateCourseModal() {
  document.getElementById('create-course-modal').classList.add('active');
}

function closeCreateCourseModal() {
  document.getElementById('create-course-modal').classList.remove('active');
}

async function handleCreateCourse(e) {
  e.preventDefault();
  const title = document.getElementById('new-course-title').value.trim();
  const subject = document.getElementById('new-course-subject').value.trim();
  const level = document.getElementById('new-course-level').value;
  const instructor = document.getElementById('new-course-instructor').value.trim();
  const duration = document.getElementById('new-course-duration').value.trim();
  const description = document.getElementById('new-course-description').value.trim();
  const lesson1Title = document.getElementById('new-lesson1-title').value.trim();
  const lesson1Content = document.getElementById('new-lesson1-content').value.trim();
  const lesson1Video = document.getElementById('new-lesson1-video').value.trim();

  if (!title || !subject || !description || !instructor) {
    showToast('Please fill in all required course fields.', 'error');
    return;
  }

  const lessons = [];
  if (lesson1Title) {
    lessons.push({
      title: lesson1Title,
      duration: '30 min',
      summary: 'Initial module introduction and syllabus roadmap.',
      content: lesson1Content || 'Welcome to this course module. Engage with the materials and complete assignments.',
      video_url: lesson1Video
    });
  }

  try {
    const res = await API.createCourse({
      title,
      subject,
      level,
      instructor,
      duration: duration || '4 Weeks',
      description,
      lessons
    });

    showToast('Course created successfully!', 'success');
    closeCreateCourseModal();
    setTimeout(() => { window.location.reload(); }, 800);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
