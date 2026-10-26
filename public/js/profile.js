// Version 1 & 3: Student Profile & Analytics Dashboard
let studentData = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadStudentProfile();
});

async function loadStudentProfile() {
  const user = API.getUser();
  if (!user) {
    document.getElementById('profile-content').innerHTML = `
      <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h2 style="font-size: 1.6rem; margin-bottom: 0.75rem;">Sign In to View Your Learning Profile</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Track enrolled courses, completed lessons, certificates, and quiz statistics.</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <a href="/login.html" class="btn btn-primary">Log In</a>
          <button class="btn btn-outline" onclick="demoLogin()">Log in as Demo Student</button>
        </div>
      </div>
    `;
    return;
  }

  try {
    const data = await API.getStudentDashboard();
    studentData = data;
    renderProfileHeader();
    renderStatsGrid();
    renderEnrolledCourses();
  } catch (err) {
    console.error('Failed to load profile:', err);
    showToast('Failed to load student data. Please log in again.', 'error');
  }
}

async function demoLogin() {
  try {
    await API.login('student@example.com', 'password123');
    window.location.reload();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderProfileHeader() {
  const u = studentData.user;
  document.getElementById('profile-name').textContent = u.name;
  document.getElementById('profile-email').textContent = u.email;
  document.getElementById('profile-bio').textContent = u.bio || 'Computer Science Student exploring modern web architecture and data systems.';
  document.getElementById('profile-avatar').textContent = u.avatar_url || 'ST';
  document.getElementById('profile-role-badge').textContent = u.role.toUpperCase();
}

function renderStatsGrid() {
  const s = studentData.stats;
  document.getElementById('stat-enrolled').textContent = s.total_enrolled;
  document.getElementById('stat-completed').textContent = s.total_completed_courses;
  document.getElementById('stat-lessons').textContent = s.total_lessons_finished;
  document.getElementById('stat-quiz-score').textContent = `${s.average_quiz_score}%`;
}

function renderEnrolledCourses() {
  const container = document.getElementById('enrolled-courses-list');
  if (!container) return;

  const courses = studentData.courses || [];
  if (courses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.25rem;">You haven't enrolled in any courses yet.</p>
        <a href="/courses.html" class="btn btn-primary">Explore Courses Catalog</a>
      </div>
    `;
    return;
  }

  container.innerHTML = courses.map(c => `
    <div class="course-card" style="margin-bottom: 1.5rem; flex-direction: row; flex-wrap: wrap;">
      <div style="background: linear-gradient(135deg, ${c.image_color || '#4f46e5'}, #1e293b); width: 140px; min-height: 140px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.5rem;">
        ${c.subject.split(' ')[0]}
      </div>
      <div class="course-body" style="flex: 1; min-width: 280px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <span class="badge ${c.is_completed ? 'badge-success' : 'badge-primary'}">${c.is_completed ? 'Completed' : 'In Progress'}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 0.5rem;">${c.subject} • ${c.level}</span>
          </div>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Enrolled: ${new Date(c.enrolled_at).toLocaleDateString()}</span>
        </div>

        <h3 class="course-title" style="margin-bottom: 0.35rem;">
          <a href="/course-detail.html?id=${c.id}">${c.title}</a>
        </h3>

        <div class="progress-container" style="margin: 0.75rem 0;">
          <div class="progress-header">
            <span>Progress (${c.completed_lessons} of ${c.total_lessons} lessons)</span>
            <span class="percentage">${c.progress_percentage}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${c.progress_percentage === 100 ? 'success' : ''}" style="width: ${c.progress_percentage}%"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            ${c.latest_quiz ? `Latest Quiz: <strong>${c.latest_quiz.score}/${c.latest_quiz.total_questions} (${c.latest_quiz.percentage}%)</strong>` : 'No quiz taken yet'}
          </span>
          <a href="/course-detail.html?id=${c.id}" class="btn btn-primary btn-sm">
            ${c.is_completed ? 'Review Course' : 'Resume Learning'}
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

// Edit Profile Modal
function openEditProfileModal() {
  const u = studentData.user;
  document.getElementById('edit-name-input').value = u.name;
  document.getElementById('edit-bio-input').value = u.bio || '';
  document.getElementById('edit-profile-modal').classList.add('active');
}

function closeEditProfileModal() {
  document.getElementById('edit-profile-modal').classList.remove('active');
}

async function handleSaveProfile(event) {
  event.preventDefault();
  const name = document.getElementById('edit-name-input').value.trim();
  const bio = document.getElementById('edit-bio-input').value.trim();

  if (!name) {
    showToast('Name cannot be empty', 'error');
    return;
  }

  try {
    const res = await API.updateStudentProfile({ name, bio });
    showToast(res.message, 'success');
    studentData.user = res.user;
    API.setUser(res.user);
    renderProfileHeader();
    closeEditProfileModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
