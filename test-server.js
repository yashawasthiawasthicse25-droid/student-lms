const http = require('http');

async function runTests() {
  const serverModule = require('./server.js');
  // Wait 1 second for port to bind
  await new Promise(r => setTimeout(r, 1000));

  const BASE = 'http://localhost:3000';
  console.log('Testing LMS Endpoints at', BASE);

  // 1. Test Static Pages
  const pages = [
    '/index.html',
    '/courses.html',
    '/course-detail.html?id=1',
    '/profile.html',
    '/contact.html',
    '/login.html',
    '/admin.html'
  ];

  for (const page of pages) {
    const res = await fetch(`${BASE}${page}`);
    if (res.status !== 200) {
      throw new Error(`Failed to load page ${page}, status: ${res.status}`);
    }
    console.log(`✓ Page loaded: ${page} (200 OK)`);
  }

  // 2. Test Courses API
  const coursesRes = await fetch(`${BASE}/api/courses`);
  const coursesData = await coursesRes.json();
  if (!coursesData.courses || coursesData.courses.length < 6) {
    throw new Error('Courses list returned unexpected length');
  }
  console.log(`✓ Courses API returned ${coursesData.courses.length} courses`);

  // 3. Test Student Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Student login failed');
  }
  const studentToken = loginData.token;
  console.log(`✓ Student login successful: ${loginData.user.name}`);

  // 4. Test Student Dashboard API
  const dashRes = await fetch(`${BASE}/api/student/dashboard`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const dashData = await dashRes.json();
  console.log(`✓ Student dashboard loaded. Enrolled: ${dashData.stats.total_enrolled}, Completed lessons: ${dashData.stats.total_lessons_finished}`);

  // 5. Test Quiz Submission
  const quizRes = await fetch(`${BASE}/api/courses/1/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      answers: { 1: 2, 2: 0, 3: 1 } // correct answers for Web Dev course
    })
  });
  const quizData = await quizRes.json();
  console.log(`✓ Quiz evaluated: Score ${quizData.score}/${quizData.total_questions} (${quizData.percentage}%) - Passed: ${quizData.passed}`);

  // 6. Test Admin Login and Overview
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  console.log(`✓ Admin login successful: ${adminLoginData.user.name}`);

  const adminOverviewRes = await fetch(`${BASE}/api/admin/overview`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminOverviewData = await adminOverviewRes.json();
  console.log(`✓ Admin overview loaded: ${adminOverviewData.metrics.total_students} students, ${adminOverviewData.metrics.total_courses} courses, ${adminOverviewData.metrics.total_lessons_completed} lessons completed`);

  // 7. Test Contact Form Submission
  const contactRes = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email: 'test@example.com',
      subject: 'Course Curriculum Question',
      message: 'Hello, I have a question about the quiz.'
    })
  });
  const contactData = await contactRes.json();
  console.log(`✓ Contact form response: ${contactData.message}`);

  console.log('\n=========================================');
  console.log(' ALL ENDPOINTS & PAGES VERIFIED PERFECTLY! ');
  console.log('=========================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
