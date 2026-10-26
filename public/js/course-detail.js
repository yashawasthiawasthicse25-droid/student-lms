// Version 2 & 3: Course Detail, Lesson Completion, Progress Tracking, and Quiz Engine
let currentCourse = null;
let activeLessonId = null;
let userQuizAnswers = {};

const recommendedYouTubeChannels = {
  'web-development-foundations': {
    name: 'Traversy Media',
    url: 'https://www.youtube.com/@TraversyMedia'
  },
  'javascript-dom-mastery': {
    name: 'Programming with Mosh',
    url: 'https://www.youtube.com/@programmingwithmosh'
  },
  'data-structures-algorithms-python': {
    name: 'freeCodeCamp.org',
    url: 'https://www.youtube.com/@freecodecamp'
  },
  'database-engineering-sql': {
    name: 'freeCodeCamp.org',
    url: 'https://www.youtube.com/@freecodecamp'
  },
  'applied-machine-learning': {
    name: 'StatQuest with Josh Starmer',
    url: 'https://www.youtube.com/@statquest'
  },
  'discrete-mathematics-cs': {
    name: 'TrevTutor',
    url: 'https://www.youtube.com/@TrevTutor'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || '1';
  await loadCourseDetail(courseId);
});

async function loadCourseDetail(idOrSlug) {
  try {
    const data = await API.getCourseDetail(idOrSlug);
    currentCourse = data.course;
    renderCourseHeader();
    renderCurriculum();
    renderLessonPlayer(currentCourse.lessons[0] ? currentCourse.lessons[0].id : null);
    renderQuizEngine();
    updateProgressUI();
  } catch (err) {
    console.error('Failed to load course detail:', err);
    document.getElementById('course-main-content').innerHTML = `
      <div class="container" style="padding: 4rem 1.5rem; text-align: center;">
        <h2 style="color: var(--danger); margin-bottom: 1rem;">Course Not Found</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">We could not locate this course in the catalog.</p>
        <a href="/courses.html" class="btn btn-primary">Browse All Courses</a>
      </div>
    `;
  }
}

function renderCourseHeader() {
  const c = currentCourse;
  document.title = `${c.title} | Student LMS`;

  const banner = document.getElementById('course-detail-banner');
  if (banner) {
    banner.style.background = `linear-gradient(135deg, ${c.image_color || '#4f46e5'}, #0f172a)`;
  }

  document.getElementById('course-subject-pill').textContent = c.subject;
  document.getElementById('course-level-pill').textContent = c.level;
  document.getElementById('course-title-text').textContent = c.title;
  document.getElementById('course-desc-text').textContent = c.description;
  document.getElementById('course-instructor-text').textContent = `Instructor: ${c.instructor}`;
  document.getElementById('course-duration-text').textContent = c.duration;
  document.getElementById('course-lessons-count').textContent = `${c.total_lessons} Lessons`;

  const enrollBtnContainer = document.getElementById('enroll-btn-container');
  if (enrollBtnContainer) {
    if (c.is_enrolled) {
      enrollBtnContainer.innerHTML = `
        <span class="badge badge-success" style="font-size: 0.9rem; padding: 0.6rem 1.25rem;">
          ✓ Enrolled in this Course
        </span>
      `;
    } else {
      enrollBtnContainer.innerHTML = `
        <button class="btn btn-primary btn-lg" onclick="handleEnroll(${c.id})">
          Enroll Now (Free)
        </button>
      `;
    }
  }
}

async function handleEnroll(courseId) {
  const user = API.getUser();
  if (!user) {
    showToast('Please log in or register to enroll in courses.', 'info');
    setTimeout(() => { window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`; }, 1200);
    return;
  }

  try {
    const res = await API.enrollCourse(courseId);
    showToast(res.message, 'success');
    currentCourse.is_enrolled = true;
    renderCourseHeader();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCurriculum() {
  const list = document.getElementById('curriculum-list');
  if (!list) return;

  if (currentCourse.lessons.length === 0) {
    list.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No lessons posted yet.</p>`;
    return;
  }

  list.innerHTML = currentCourse.lessons.map(lesson => {
    const isCompleted = lesson.completed;
    const isActive = lesson.id === activeLessonId;

    return `
      <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}" 
           id="lesson-item-${lesson.id}"
           onclick="renderLessonPlayer(${lesson.id})">
        <div class="lesson-left">
          <input type="checkbox" 
                 class="lesson-checkbox" 
                 ${isCompleted ? 'checked' : ''} 
                 onclick="event.stopPropagation(); handleToggleLesson(${lesson.id})"
                 title="Mark as completed" />
          <div>
            <div class="lesson-title-text">${lesson.order_num}. ${lesson.title}</div>
            <div class="lesson-duration">${lesson.duration} • ${lesson.summary}</div>
          </div>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-light);">▶</span>
      </div>
    `;
  }).join('');
}

function renderLessonPlayer(lessonId) {
  if (!lessonId && currentCourse.lessons.length > 0) {
    lessonId = currentCourse.lessons[0].id;
  }

  activeLessonId = lessonId;
  const lesson = currentCourse.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  // Highlight active lesson in list
  document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
  const activeEl = document.getElementById(`lesson-item-${lesson.id}`);
  if (activeEl) activeEl.classList.add('active');

  const playerContainer = document.getElementById('lesson-player-container');
  if (!playerContainer) return;

  const channel = recommendedYouTubeChannels[currentCourse.slug] || {
    name: 'freeCodeCamp.org',
    url: 'https://www.youtube.com/@freecodecamp'
  };
  const lessonSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${lesson.title} ${channel.name}`)}`;
  const lessonMedia = `
    <section class="lesson-video-resource-card" aria-label="Recommended video lecture">
      <div class="lesson-video-play-icon" aria-hidden="true">▶</div>
      <p class="lesson-video-eyebrow">Curated YouTube lecture</p>
      <h3>${escapeHtml(lesson.title)}</h3>
      <p>Find this topic from <strong>${escapeHtml(channel.name)}</strong>. Lectures open directly on YouTube so restricted embeds won't interrupt your lesson.</p>
      <div class="lesson-video-actions">
        <a class="btn btn-primary" href="${lessonSearchUrl}" target="_blank" rel="noopener noreferrer">Find this lesson</a>
        <a class="btn btn-outline" href="${channel.url}" target="_blank" rel="noopener noreferrer">Browse ${escapeHtml(channel.name)}</a>
      </div>
    </section>
  `;

  playerContainer.innerHTML = `
    ${lessonMedia}

    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <h2 style="font-size: 1.4rem; font-weight: 700;">Lesson Overview</h2>
      <button class="btn ${lesson.completed ? 'btn-success' : 'btn-outline'}" onclick="handleToggleLesson(${lesson.id})">
        ${lesson.completed ? '✓ Completed' : 'Mark as Complete'}
      </button>
    </div>

    <div class="lesson-content-text">
      <p style="margin-bottom: 1rem; font-weight: 500;">${lesson.summary}</p>
      <p>${lesson.content}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

// Version 2 & 3: Toggle Lesson Completion
async function handleToggleLesson(lessonId) {
  const user = API.getUser();
  if (!user) {
    showToast('Please sign in to track your learning progress.', 'info');
    setTimeout(() => { window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`; }, 1200);
    return;
  }

  try {
    const res = await API.toggleLesson(currentCourse.id, lessonId);
    
    // Update local lesson state
    const lesson = currentCourse.lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.completed = res.completed;
    }

    currentCourse.completed_lessons = res.completedCount;
    currentCourse.progress_percentage = res.progressPercentage;
    currentCourse.is_enrolled = true;

    showToast(res.message, 'success');
    renderCurriculum();
    renderLessonPlayer(lessonId);
    updateProgressUI();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Version 2: Dynamic Progress Calculation
function updateProgressUI() {
  const c = currentCourse;
  const percent = c.progress_percentage || 0;

  const headerProgress = document.getElementById('course-progress-header');
  if (headerProgress) {
    headerProgress.innerHTML = `
      <div class="progress-container">
        <div class="progress-header">
          <span>Overall Course Progress</span>
          <span class="percentage" id="progress-percentage-display">${percent}% (${c.completed_lessons || 0}/${c.total_lessons || 0} Lessons)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${percent === 100 ? 'success' : ''}" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }
}

// Version 2 & 3: Interactive Quiz Engine
function renderQuizEngine() {
  const quizContainer = document.getElementById('quiz-engine-container');
  if (!quizContainer) return;

  const quizzes = currentCourse.quizzes || [];
  if (quizzes.length === 0) {
    quizContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        No quiz questions available for this course yet.
      </div>
    `;
    return;
  }

  userQuizAnswers = {};

  quizContainer.innerHTML = `
    <div id="quiz-result-banner"></div>
    <form id="quiz-form" onsubmit="event.preventDefault(); handleQuizSubmit();">
      ${quizzes.map((q, idx) => `
        <div class="quiz-question-box" id="quiz-box-${q.id}">
          <div class="quiz-question-title">Question ${idx + 1} of ${quizzes.length}: ${escapeHtml(q.question)}</div>
          <div class="quiz-options-group">
            ${q.options.map((opt, optIdx) => `
              <label class="quiz-option-label" id="opt-label-${q.id}-${optIdx}">
                <input type="radio" 
                       name="quiz_${q.id}" 
                       value="${optIdx}" 
                       onchange="userQuizAnswers[${q.id}] = ${optIdx}" />
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
          <div id="quiz-feedback-${q.id}"></div>
        </div>
      `).join('')}

      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button type="submit" class="btn btn-primary btn-lg" id="submit-quiz-btn">Submit Quiz Answers</button>
        <button type="button" class="btn btn-outline btn-lg" id="reset-quiz-btn" style="display: none;" onclick="renderQuizEngine()">Retake Quiz</button>
      </div>
    </form>
  `;
}

async function handleQuizSubmit() {
  const user = API.getUser();
  if (!user) {
    showToast('Please log in to submit your quiz and record your score.', 'info');
    setTimeout(() => { window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`; }, 1200);
    return;
  }

  const quizzes = currentCourse.quizzes || [];
  const answeredCount = Object.keys(userQuizAnswers).length;

  if (answeredCount < quizzes.length) {
    showToast(`Please answer all ${quizzes.length} questions before submitting.`, 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-quiz-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Grading Answers...';
  }

  try {
    const res = await API.submitQuiz(currentCourse.id, userQuizAnswers);
    renderQuizResults(res);
    showToast(`Quiz completed! You scored ${res.score}/${res.total_questions} (${res.percentage}%)`, res.passed ? 'success' : 'info');
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Quiz Answers';
    }
  }
}

function renderQuizResults(data) {
  const banner = document.getElementById('quiz-result-banner');
  if (banner) {
    banner.innerHTML = `
      <div class="quiz-score-banner ${data.passed ? 'pass' : 'fail'}">
        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">
          ${data.passed ? '🎉 Congratulations! You Passed!' : '📖 Keep Practicing!'}
        </h3>
        <p style="font-size: 1.1rem; font-weight: 700;">
          Your Score: ${data.score} / ${data.total_questions} (${data.percentage}%)
        </p>
        <p style="font-size: 0.9rem; margin-top: 0.25rem;">
          ${data.passed ? 'Great job mastering the core competencies of this course.' : 'Review the explanations below and try retaking the quiz.'}
        </p>
      </div>
    `;
  }

  // Highlight each option and show explanation
  data.results.forEach(item => {
    const qId = item.quiz_id;

    // Disable all radio buttons for this question
    document.querySelectorAll(`input[name="quiz_${qId}"]`).forEach(input => {
      input.disabled = true;
    });

    const chosenLabel = document.getElementById(`opt-label-${qId}-${item.selected_index}`);
    const correctLabel = document.getElementById(`opt-label-${qId}-${item.correct_index}`);

    if (correctLabel) correctLabel.classList.add('correct');
    if (!item.is_correct && chosenLabel) chosenLabel.classList.add('incorrect');

    const feedbackBox = document.getElementById(`quiz-feedback-${qId}`);
    if (feedbackBox) {
      feedbackBox.className = `quiz-feedback ${item.is_correct ? 'success' : 'error'}`;
      feedbackBox.innerHTML = `
        <strong>${item.is_correct ? '✓ Correct!' : '✕ Incorrect.'}</strong> ${item.explanation || ''}
      `;
    }
  });

  const submitBtn = document.getElementById('submit-quiz-btn');
  const resetBtn = document.getElementById('reset-quiz-btn');
  if (submitBtn) submitBtn.style.display = 'none';
  if (resetBtn) resetBtn.style.display = 'inline-flex';
}
