// Version 2: Course Searching, Filtering, and Dynamic Rendering
let allCourses = [];
let activeSubject = 'all';
let activeLevel = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupFilterControls();
  await loadCourses();
});

function setupFilterControls() {
  const searchInput = document.getElementById('course-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterAndRenderCourses();
    });
  }

  // Subject filter pills
  const subjectPills = document.querySelectorAll('.filter-pill[data-subject]');
  subjectPills.forEach(pill => {
    pill.addEventListener('click', () => {
      subjectPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeSubject = pill.dataset.subject;
      filterAndRenderCourses();
    });
  });

  // Level selector
  const levelSelect = document.getElementById('course-level-select');
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      activeLevel = e.target.value;
      filterAndRenderCourses();
    });
  }
}

async function loadCourses() {
  const container = document.getElementById('courses-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <p style="color: var(--text-muted); font-size: 1.1rem;">Loading courses catalog...</p>
    </div>
  `;

  try {
    const data = await API.getCourses();
    allCourses = data.courses || [];
    filterAndRenderCourses();
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="color: var(--danger); font-size: 1.1rem;">Failed to load courses. Please make sure the LMS server is running.</p>
      </div>
    `;
  }
}

function filterAndRenderCourses() {
  const container = document.getElementById('courses-container');
  const countBadge = document.getElementById('courses-count');
  if (!container) return;

  const filtered = allCourses.filter(course => {
    const matchesSearch = !searchQuery ||
      course.title.toLowerCase().includes(searchQuery) ||
      course.description.toLowerCase().includes(searchQuery) ||
      course.instructor.toLowerCase().includes(searchQuery) ||
      course.subject.toLowerCase().includes(searchQuery);

    const matchesSubject = activeSubject === 'all' || course.subject.toLowerCase() === activeSubject.toLowerCase();
    const matchesLevel = activeLevel === 'all' || course.level.toLowerCase() === activeLevel.toLowerCase();

    return matchesSearch && matchesSubject && matchesLevel;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Course${filtered.length === 1 ? '' : 's'} Available`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">No matching courses found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your keywords, subject, or difficulty level filters.</p>
        <button class="btn btn-outline" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(course => {
    const progressBlock = course.is_enrolled ? `
      <div class="progress-container" style="margin-top: 0.5rem; margin-bottom: 1rem;">
        <div class="progress-header">
          <span>Your Progress</span>
          <span class="percentage">${course.progress_percentage}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${course.progress_percentage === 100 ? 'success' : ''}" style="width: ${course.progress_percentage}%"></div>
        </div>
      </div>
    ` : '';

    const actionButton = course.is_enrolled ?
      `<a href="/course-detail.html?id=${course.id}" class="btn btn-primary" style="width: 100%;">Continue Learning</a>` :
      `<a href="/course-detail.html?id=${course.id}" class="btn btn-outline" style="width: 100%;">View Curriculum</a>`;

    return `
      <article class="course-card">
        <div class="course-banner" style="background: linear-gradient(135deg, ${course.image_color || '#4f46e5'}, #1e293b);">
          <span class="course-subject-tag">${course.subject}</span>
          <span class="badge ${course.badge === 'Bestseller' ? 'badge-accent' : 'badge-primary'}">${course.badge || 'Course'}</span>
        </div>
        <div class="course-body">
          <div class="course-level">${course.level} • By ${course.instructor}</div>
          <h3 class="course-title">
            <a href="/course-detail.html?id=${course.id}">${course.title}</a>
          </h3>
          <p class="course-desc">${course.description}</p>
          
          ${progressBlock}

          <div class="course-meta">
            <span class="course-meta-item">⏱ ${course.duration}</span>
            <span class="course-meta-item">📚 ${course.lesson_count} Lessons</span>
            <span class="course-meta-item">📝 ${course.quiz_count} Quizzes</span>
          </div>

          <div class="course-card-footer">
            ${actionButton}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function resetFilters() {
  searchQuery = '';
  activeSubject = 'all';
  activeLevel = 'all';

  const searchInput = document.getElementById('course-search-input');
  if (searchInput) searchInput.value = '';

  const subjectPills = document.querySelectorAll('.filter-pill[data-subject]');
  subjectPills.forEach(p => {
    p.classList.toggle('active', p.dataset.subject === 'all');
  });

  const levelSelect = document.getElementById('course-level-select');
  if (levelSelect) levelSelect.value = 'all';

  filterAndRenderCourses();
}
