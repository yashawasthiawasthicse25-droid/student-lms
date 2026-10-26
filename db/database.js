const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');

const dbPath = path.join(__dirname, 'lms.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

const lessonVideoUrls = {
  'web-development-foundations': [
    'https://www.youtube.com/watch?v=UB1O30fR-EE',
    'https://www.youtube.com/watch?v=yfoY53QXEnI',
    'https://www.youtube.com/watch?v=JJSoEo8JSnc',
    'https://www.youtube.com/watch?v=0xMQfnTU6oo',
    'https://www.youtube.com/watch?v=yfoY53QXEnI'
  ],
  'javascript-dom-mastery': [
    'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    'https://www.youtube.com/watch?v=W6NZfCO5SIk'
  ],
  'data-structures-algorithms-python': [
    'https://www.youtube.com/watch?v=8hly31xKli0',
    'https://www.youtube.com/watch?v=8hly31xKli0',
    'https://www.youtube.com/watch?v=8hly31xKli0',
    'https://www.youtube.com/watch?v=8hly31xKli0'
  ],
  'database-engineering-sql': [
    'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ],
  'applied-machine-learning': [
    'https://www.youtube.com/watch?v=7eh4d6sabA0',
    'https://www.youtube.com/watch?v=7eh4d6sabA0',
    'https://www.youtube.com/watch?v=7eh4d6sabA0'
  ],
  'discrete-mathematics-cs': [
    'https://www.youtube.com/watch?v=pTnEG_WGd2Q',
    'https://www.youtube.com/watch?v=pTnEG_WGd2Q'
  ]
};

const supplementalQuizQuestions = {
  'web-development-foundations': [
    {
      question: 'Which HTML attribute connects a label to a form control for accessibility?',
      options: ["The label's for attribute matching the control's id", "The label's href attribute", "The control's title attribute only", "The form's name attribute"],
      correct_index: 0,
      explanation: 'A label’s for value should match the associated input id so assistive technology and click targets identify the control.'
    },
    {
      question: 'In CSS Grid, what does minmax(250px, 1fr) specify for a track?',
      options: [
        'A fixed width of 250 pixels.',
        'A minimum of 250 pixels and a maximum share of available space.',
        'A maximum of 250 pixels and a minimum share of available space.',
        'Two separate tracks, one 250 pixels and one fractional.'
      ],
      correct_index: 1,
      explanation: 'minmax() sets the track’s lower and upper bounds; 1fr lets it grow to take a share of remaining space.'
    }
  ],
  'javascript-dom-mastery': [
    {
      question: 'Which statement about await inside an async function is correct?',
      options: [
        'It blocks the entire JavaScript runtime until the promise resolves.',
        'It pauses that async function while allowing other work to continue.',
        'It converts the promise into a callback.',
        'It can only be used with timer functions.'
      ],
      correct_index: 1,
      explanation: 'await suspends the current async function until its promise settles; it does not block the JavaScript runtime.'
    },
    {
      question: 'What does Array.prototype.map() return?',
      options: [
        'The original array after modifying each item.',
        'A new array containing the result of the callback for each item.',
        'The first item that matches the callback.',
        'A boolean indicating whether every item passed a test.'
      ],
      correct_index: 1,
      explanation: 'map() builds and returns a new array by applying its callback to each element.'
    },
    {
      question: 'When does the finally block of a try/catch/finally statement run?',
      options: [
        'Only when the try block throws an error.',
        'Only when the try block completes without an error.',
        'After try/catch whether the operation succeeds or fails.',
        'Before the try block starts.'
      ],
      correct_index: 2,
      explanation: 'finally runs after try/catch completes, making it useful for cleanup regardless of success or failure.'
    }
  ],
  'data-structures-algorithms-python': [
    {
      question: 'Which data structure does breadth-first search use to visit vertices in increasing distance order?',
      options: ['A stack', 'A min-heap', 'A FIFO queue', 'A hash set'],
      correct_index: 2,
      explanation: 'A FIFO queue processes discovered vertices in arrival order, level by level.'
    },
    {
      question: 'What is the average time complexity of looking up a key in a well-distributed Python dictionary?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct_index: 0,
      explanation: 'Hash-table lookup is O(1) on average, though pathological collisions can make a lookup slower.'
    },
    {
      question: 'Which traversal of a binary search tree visits its keys in sorted order?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level order'],
      correct_index: 1,
      explanation: 'Inorder traversal visits the left subtree, node, then right subtree, producing sorted keys in a BST.'
    }
  ],
  'database-engineering-sql': [
    {
      question: 'What is the main trade-off of adding an index to a frequently queried database column?',
      options: [
        'Lookups can be faster, but writes and storage use more resources.',
        'Queries become faster and inserts require no extra work.',
        'The index removes duplicate rows automatically.',
        'The index replaces the need for database constraints.'
      ],
      correct_index: 0,
      explanation: 'Indexes speed up many reads but require additional storage and must be updated when rows change.'
    },
    {
      question: 'Which SQL clause filters grouped results after aggregate functions have been calculated?',
      options: ['WHERE', 'ORDER BY', 'HAVING', 'DISTINCT'],
      correct_index: 2,
      explanation: 'HAVING filters groups after GROUP BY; WHERE filters rows before grouping.'
    },
    {
      question: 'What does a foreign key constraint primarily enforce?',
      options: [
        'That a column contains no duplicate values.',
        'Referential integrity between related tables.',
        'That rows are automatically sorted.',
        'That every query uses an index.'
      ],
      correct_index: 1,
      explanation: 'A foreign key ensures referenced values correspond to valid rows in the related table (or follow its configured delete/update rules).'
    }
  ],
  'applied-machine-learning': [
    {
      question: 'When should preprocessing transformations be fitted to avoid leaking information from the test set?',
      options: [
        'Fit them on the full dataset before splitting.',
        'Fit them on the training data, then apply them to the test data.',
        'Fit them only on the test data.',
        'Fit them separately on training and test data.'
      ],
      correct_index: 1,
      explanation: 'Fit preprocessing only on training data; applying the learned transformation to test data preserves an unbiased evaluation.'
    },
    {
      question: 'What is a common effect of increasing regularization strength?',
      options: [
        'The model becomes more complex and training error always reaches zero.',
        'The model is penalized for complexity, which can reduce overfitting.',
        'The test set is added to the training set.',
        'Feature scaling is no longer needed.'
      ],
      correct_index: 1,
      explanation: 'Regularization penalizes overly complex models, often improving generalization when its strength is chosen appropriately.'
    },
    {
      question: 'Why is a validation set commonly used during model development?',
      options: [
        'To tune model choices without using the final test set.',
        'To replace the need for training data.',
        'To guarantee a perfect score on unseen data.',
        'To increase the number of model features automatically.'
      ],
      correct_index: 0,
      explanation: 'Validation data supports model selection and hyperparameter tuning while keeping the test set available for a final unbiased evaluation.'
    },
    {
      question: 'For a highly imbalanced classification problem, which metric may be more informative than accuracy alone?',
      options: ['The number of model parameters', 'Precision and recall', 'Training duration', 'The mean of the feature values'],
      correct_index: 1,
      explanation: 'Precision and recall reveal positive-class performance that can be hidden by high accuracy on an imbalanced dataset.'
    }
  ],
  'discrete-mathematics-cs': [
    {
      question: 'For which truth values is the implication P → Q false?',
      options: [
        'P is false and Q is false.',
        'P is false and Q is true.',
        'P is true and Q is false.',
        'P is true and Q is true.'
      ],
      correct_index: 2,
      explanation: 'An implication is false only when its premise P is true and its conclusion Q is false.'
    },
    {
      question: 'What are the two essential parts of a proof by mathematical induction?',
      options: [
        'A counterexample and a contradiction.',
        'A base case and an inductive step from k to k + 1.',
        'A truth table and a Venn diagram.',
        'A recursive definition and a graph.'
      ],
      correct_index: 1,
      explanation: 'Induction proves a base case and then shows that truth for k implies truth for k + 1.'
    },
    {
      question: 'What is the cardinality of the power set of a finite set with n elements?',
      options: ['n', 'n squared', '2 to the power n', 'n factorial'],
      correct_index: 2,
      explanation: 'Each of n elements can independently be included or excluded, giving 2^n subsets.'
    },
    {
      question: 'If a relation is both symmetric and antisymmetric, which statement must hold for any related elements a and b?',
      options: [
        'If a is related to b, then a and b must be equal.',
        'Every element is related to every other element.',
        'No element is related to itself.',
        'The relation must be transitive.'
      ],
      correct_index: 0,
      explanation: 'Symmetry gives b related to a; antisymmetry then implies a = b.'
    }
  ]
};

// Password hashing utilities using built-in scrypt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT NOT NULL,
      instructor TEXT NOT NULL,
      duration TEXT NOT NULL,
      badge TEXT DEFAULT 'Popular',
      image_color TEXT DEFAULT '#4f46e5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      order_num INTEGER NOT NULL,
      duration TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      video_url TEXT
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      email_delivery_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const lessonColumns = db.prepare('PRAGMA table_info(lessons)').all();
  if (!lessonColumns.some(column => column.name === 'video_url')) {
    db.exec('ALTER TABLE lessons ADD COLUMN video_url TEXT');
  }

  const contactColumns = db.prepare('PRAGMA table_info(contact_messages)').all();
  if (!contactColumns.some(column => column.name === 'email_delivery_status')) {
    db.exec("ALTER TABLE contact_messages ADD COLUMN email_delivery_status TEXT DEFAULT 'pending'");
  }

  seedData();
  seedLessonVideos();
  seedSupplementalQuizzes();
}

function seedSupplementalQuizzes() {
  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (course_id, question, options_json, correct_index, explanation)
    VALUES (?, ?, ?, ?, ?)
  `);
  const findCourse = db.prepare('SELECT id FROM courses WHERE slug = ?');
  const countQuizzes = db.prepare('SELECT COUNT(*) AS count FROM quizzes WHERE course_id = ?');
  const findQuestion = db.prepare('SELECT id FROM quizzes WHERE course_id = ? AND question = ?');

  Object.entries(supplementalQuizQuestions).forEach(([slug, questions]) => {
    const course = findCourse.get(slug);
    if (!course) return;

    let count = countQuizzes.get(course.id).count;
    for (const question of questions) {
      if (count >= 5) break;
      if (findQuestion.get(course.id, question.question)) continue;

      insertQuiz.run(
        course.id,
        question.question,
        JSON.stringify(question.options),
        question.correct_index,
        question.explanation
      );
      count++;
    }
  });
}

function seedLessonVideos() {
  const updateVideo = db.prepare(`
    UPDATE lessons
    SET video_url = ?
    WHERE course_id = ? AND order_num = ? AND video_url IS NULL
  `);

  Object.entries(lessonVideoUrls).forEach(([slug, urls]) => {
    const course = db.prepare('SELECT id FROM courses WHERE slug = ?').get(slug);
    if (!course) return;

    urls.forEach((url, index) => {
      updateVideo.run(url, course.id, index + 1);
    });
  });
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial LMS data...');

  // 1. Seed users (1 student, 1 teacher/admin)
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, bio, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const studentHash = hashPassword('password123');
  const adminHash = hashPassword('admin123');

  const studentResult = insertUser.run(
    'Alex Rivera',
    'student@example.com',
    studentHash,
    'student',
    'Enthusiastic Computer Science undergrad specializing in frontend systems & AI.',
    'AR'
  );
  const studentId = studentResult.lastInsertRowid;

  insertUser.run(
    'Dr. Sarah Chen',
    'admin@example.com',
    adminHash,
    'admin',
    'Lead Instructor & Faculty Chair in Software Engineering.',
    'SC'
  );

  // 2. Seed Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, slug, subject, level, description, instructor, duration, badge, image_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const coursesData = [
    {
      title: 'Web Development Foundations: HTML, CSS & Modern Layouts',
      slug: 'web-development-foundations',
      subject: 'Web Development',
      level: 'Beginner',
      description: 'Master semantic HTML5, CSS Grid, Flexbox, responsive typography, and modern responsive UI architecture from scratch.',
      instructor: 'Dr. Sarah Chen',
      duration: '6 Weeks (18 hrs)',
      badge: 'Bestseller',
      image_color: '#3b82f6',
      lessons: [
        {
          title: 'Semantic HTML5 Architecture & Document Structure',
          duration: '35 min',
          summary: 'Learn native semantic tags, document outlines, and accessibility fundamentals.',
          content: 'Semantic HTML introduces meaning to web page structures. We explore header, nav, main, article, section, aside, and footer. Learn why semantics are critical for screen readers, SEO, and maintainable CSS selectors.'
        },
        {
          title: 'CSS Box Model, Modern Resets, & Custom Properties',
          duration: '45 min',
          summary: 'Master box-sizing, fluid spacing variables, and design tokens in vanilla CSS.',
          content: 'Learn how margin, border, padding, and content interact. Define reusable theme tokens using CSS custom properties (--primary, --surface, --radius) to build cohesive, scalable design systems.'
        },
        {
          title: 'Flexbox Deep Dive: Alignment, Distribution, & Stacking',
          duration: '50 min',
          summary: 'Solve single-dimensional layout challenges with flex-direction, justify-content, and align-items.',
          content: 'Flexbox is indispensable for component-level UI. We construct navigation bars, responsive card rows, and auto-centering modals without float or table hacks.'
        },
        {
          title: 'CSS Grid Mastery: Two-Dimensional Responsive Layouts',
          duration: '60 min',
          summary: 'Harness grid-template-columns, minmax, auto-fit, and grid areas for seamless layouts.',
          content: 'CSS Grid handles 2D layout with effortless fluid wrapping. Understand minmax(300px, 1fr) and repeat(auto-fit, ...) to create layouts that look stunning on mobile and 4K displays alike.'
        },
        {
          title: 'Responsive Design & Media Queries',
          duration: '40 min',
          summary: 'Mobile-first design principles, viewport breakpoints, and touch-target ergonomics.',
          content: 'Discover mobile-first responsive strategy. Test breakpoints, fluid typography with clamp(), and ensure all interactive controls meet minimum accessible touch target criteria.'
        }
      ],
      quizzes: [
        {
          question: 'Which HTML5 element should be used for the primary thematic navigation of a web application?',
          options: ['<div class="nav">', '<navigation>', '<nav>', '<menuitem>'],
          correct_index: 2,
          explanation: '<nav> is the standard semantic element designated for major navigational blocks.'
        },
        {
          question: 'In modern CSS, which declaration prevents element padding and borders from inflating total width?',
          options: ['box-sizing: border-box;', 'display: contents;', 'overflow: clip;', 'width: auto;'],
          correct_index: 0,
          explanation: 'box-sizing: border-box ensures padding and borders are factored inside the declared width/height.'
        },
        {
          question: 'Which CSS Grid pattern creates automatically wrapping responsive columns without manual media queries?',
          options: ['grid-template-columns: repeat(3, 1fr);', 'grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));', 'grid-auto-flow: dense;', 'columns: 3 auto;'],
          correct_index: 1,
          explanation: 'repeat(auto-fit, minmax(280px, 1fr)) dynamically packs as many columns as will fit at >= 280px width.'
        }
      ]
    },
    {
      title: 'Interactive JavaScript & Modern DOM Mastery',
      slug: 'javascript-dom-mastery',
      subject: 'Web Development',
      level: 'Intermediate',
      description: 'Build dynamic single-page applications with ES6+, event delegation, async/await, and reactive client state.',
      instructor: 'Marcus Brody',
      duration: '8 Weeks (24 hrs)',
      badge: 'Hot',
      image_color: '#10b981',
      lessons: [
        {
          title: 'Modern ES6+ Syntax, Modules & Destructuring',
          duration: '40 min',
          summary: 'Explore const/let, arrow functions, object destructuring, and ES modules.',
          content: 'Modern JavaScript features clean, expressive syntax. We review default arguments, rest/spread operators, template literals, and modular script isolation.'
        },
        {
          title: 'DOM Querying, Manipulation & Event Delegation',
          duration: '55 min',
          summary: 'Efficiently manipulate the DOM tree and handle high-volume user interactions.',
          content: 'Understand querySelectorAll, dataset attributes, createElement, and document fragments. Master event bubbling and event delegation to bind single listeners on parent containers.'
        },
        {
          title: 'Asynchronous JavaScript: Promises & Async/Await',
          duration: '60 min',
          summary: 'Master asynchronous flow, fetch API, error handling, and parallel execution with Promise.all.',
          content: 'Delve into the event loop, microtask queue, try/catch with async/await, and consuming REST APIs reliably with error boundaries and user loading states.'
        },
        {
          title: 'Client State Management & LocalStorage Persistence',
          duration: '45 min',
          summary: 'Construct a predictable pub/sub state store and synchronize state with Web Storage.',
          content: 'Learn how to model application state as a single source of truth. Manage optimistic UI updates and serialize state safely into localStorage and session cookies.'
        }
      ],
      quizzes: [
        {
          question: 'What is the primary advantage of event delegation in JavaScript?',
          options: [
            'It forces events to trigger synchronously before DOM rendering',
            'It allows one parent listener to manage events on present and future child elements',
            'It cancels all default browser mouse actions',
            'It converts mouse clicks into touch gestures'
          ],
          correct_index: 1,
          explanation: 'Event delegation leverages event bubbling to handle actions on multiple child elements with a single listener.'
        },
        {
          question: 'How do you handle errors properly when using async/await syntax?',
          options: [
            'Using an async.catch() chained callback',
            'Enclosing the awaited call inside a try...catch block',
            'Setting window.onerror = null',
            'By passing an error callback as the second argument to await'
          ],
          correct_index: 1,
          explanation: 'In async functions, rejected promises throw exceptions that can be caught cleanly with standard try...catch blocks.'
        }
      ]
    },
    {
      title: 'Data Structures & Algorithms in Python',
      slug: 'data-structures-algorithms-python',
      subject: 'Computer Science',
      level: 'Intermediate',
      description: 'Conquer computational complexity, linked lists, trees, graphs, sorting, and dynamic programming with hands-on Python.',
      instructor: 'Prof. Elena Rostova',
      duration: '10 Weeks (30 hrs)',
      badge: 'Essential',
      image_color: '#8b5cf6',
      lessons: [
        {
          title: 'Algorithmic Complexity & Big-O Notation',
          duration: '45 min',
          summary: 'Analyze time and space complexity with Big-O, Omega, and Theta classifications.',
          content: 'Understanding algorithmic bounds is central to computer science. We contrast O(1), O(log n), O(n), O(n log n), O(n^2), and exponential runtimes with practical execution benchmarks.'
        },
        {
          title: 'Linear Data Structures: Stacks, Queues, and Linked Lists',
          duration: '60 min',
          summary: 'Implement singly/doubly linked lists, LIFO stacks, and FIFO queues from ground zero.',
          content: 'Build node-based memory structures. Contrast array-based continuous memory allocations with pointer-connected nodes for constant-time insertions and deletions.'
        },
        {
          title: 'Binary Trees, BSTs & Balanced Search Structures',
          duration: '75 min',
          summary: 'Implement recursive tree traversals (pre, in, post, level order) and search trees.',
          content: 'Explore hierarchical data representation. Implement binary search trees, validate BST invariants, and learn why self-balancing trees prevent degenerate O(n) performance.'
        },
        {
          title: 'Graph Traversal: Breadth-First & Depth-First Search',
          duration: '60 min',
          summary: 'Graph representations (adjacency lists vs matrices) and BFS/DFS traversal mechanics.',
          content: 'Model network topologies, social graphs, and dependency trees. Implement BFS for shortest path discovery and DFS for cycle detection and topological sorting.'
        }
      ],
      quizzes: [
        {
          question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correct_index: 1,
          explanation: 'In a balanced BST, each comparison halves the search space, giving logarithmic O(log n) time complexity.'
        },
        {
          question: 'Which traversal algorithm uses a FIFO Queue to visit nodes level-by-level?',
          options: ['Depth-First Search', 'Topological Sort', 'Breadth-First Search', 'In-Order Traversal'],
          correct_index: 2,
          explanation: 'BFS uses a FIFO queue to discover all neighbors at depth d before moving to depth d+1.'
        }
      ]
    },
    {
      title: 'Database Engineering & SQL Architecture',
      slug: 'database-engineering-sql',
      subject: 'Computer Science',
      level: 'Advanced',
      description: 'Master relational schema design, normalization, indexing strategies, ACID transactions, and query optimization.',
      instructor: 'Dr. Sarah Chen',
      duration: '6 Weeks (20 hrs)',
      badge: 'Advanced',
      image_color: '#f59e0b',
      lessons: [
        {
          title: 'Relational Modeling & Normal Forms (1NF through BCNF)',
          duration: '50 min',
          summary: 'Design robust schemas that eliminate redundant anomalies and preserve data integrity.',
          content: 'Examine entity-relationship models, foreign keys, cardinality, and normalization to eliminate update, insertion, and deletion anomalies.'
        },
        {
          title: 'Complex Joins, Window Functions & CTE Expressions',
          duration: '65 min',
          summary: 'Write high-performance analytical queries with Common Table Expressions and windowing.',
          content: 'Go beyond basic SELECT queries. Master INNER, LEFT, FULL OUTER joins, recursive CTEs, and window functions like ROW_NUMBER(), RANK(), and LAG().'
        },
        {
          title: 'Index Internals: B-Trees, Hash Indexes & EXPLAIN QUERY PLAN',
          duration: '60 min',
          summary: 'Diagnose slow queries and design optimal composite indices for production scale.',
          content: 'Inspect how database engines store and retrieve pages. Use EXPLAIN QUERY PLAN to detect full table scans and build covering indices.'
        }
      ],
      quizzes: [
        {
          question: 'Which database isolation property guarantees that concurrent transactions yield the same outcome as executing sequentially?',
          options: ['Atomicity', 'Consistency', 'Isolation (Serializability)', 'Durability'],
          correct_index: 2,
          explanation: 'Serializability is the highest isolation level, ensuring transactions execute as if they were strictly serial.'
        },
        {
          question: 'What does a database B-Tree index minimize when searching records on disk?',
          options: ['RAM consumption', 'Number of disk I/O page reads', 'CPU registers used', 'SQL query character length'],
          correct_index: 1,
          explanation: 'B-Trees have high fan-out, minimizing the depth of the tree and hence the count of disk page fetches needed to find a key.'
        }
      ]
    },
    {
      title: 'Applied Machine Learning with Python',
      slug: 'applied-machine-learning',
      subject: 'Data Science',
      level: 'Intermediate',
      description: 'Build predictive models, evaluate generalization metrics, and engineer pipelines with scikit-learn and pandas.',
      instructor: 'Prof. David Vance',
      duration: '8 Weeks (22 hrs)',
      badge: 'Trending',
      image_color: '#ec4899',
      lessons: [
        {
          title: 'Data Preprocessing, Imputation, & Feature Scaling',
          duration: '45 min',
          summary: 'Handle missing values, encode categorical variables, and normalize numerical distributions.',
          content: 'Data quality determines model efficacy. We practice standard scaling, min-max normalization, one-hot encoding, and imputing null features.'
        },
        {
          title: 'Supervised Learning: Regression & Classification',
          duration: '60 min',
          summary: 'Implement linear regression, logistic regression, decision trees, and random forests.',
          content: 'Learn loss functions, gradient descent, bias-variance tradeoff, and tree-based ensemble methods for tabular data classification.'
        },
        {
          title: 'Model Evaluation: Precision, Recall, ROC-AUC & Cross-Validation',
          duration: '50 min',
          summary: 'Measure true generalization performance and avoid data leakage in pipelines.',
          content: 'Understand why accuracy is misleading for imbalanced datasets. Calculate precision, recall, F1-scores, and run stratified k-fold cross-validation.'
        }
      ],
      quizzes: [
        {
          question: 'Which metric is most informative when evaluating a model on severely class-imbalanced data?',
          options: ['Raw Accuracy', 'Precision-Recall / F1-Score', 'Mean Squared Error', 'Adjusted R-squared'],
          correct_index: 1,
          explanation: 'When one class is rare (e.g., fraud detection), raw accuracy is skewed; precision, recall, and F1 provide true diagnostic power.'
        }
      ]
    },
    {
      title: 'Discrete Mathematics for Computer Science',
      slug: 'discrete-mathematics-cs',
      subject: 'Mathematics',
      level: 'Beginner',
      description: 'Foundations of logic, sets, relations, combinatorics, proof techniques, and graph theory for software engineers.',
      instructor: 'Dr. Sarah Chen',
      duration: '6 Weeks (18 hrs)',
      badge: 'Core',
      image_color: '#06b6d4',
      lessons: [
        {
          title: 'Propositional Logic, Truth Tables & Predicates',
          duration: '40 min',
          summary: 'Deconstruct logical connectives, truth tables, tautologies, and quantifiers.',
          content: 'Formal logic underpins conditional branches, digital circuits, and formal verification. We analyze implication, contrapositives, and De Morgan’s laws.'
        },
        {
          title: 'Mathematical Induction & Proof by Contradiction',
          duration: '50 min',
          summary: 'Master foundational proof mechanisms used to verify algorithm correctness.',
          content: 'Prove base cases and inductive steps for loop invariants. Apply proof by contradiction to classic proofs like Euclid’s prime infinitude.'
        }
      ],
      quizzes: [
        {
          question: 'What is the contrapositive of the implication "If P, then Q"?',
          options: ['If Q, then P', 'If not P, then not Q', 'If not Q, then not P', 'P and not Q'],
          correct_index: 2,
          explanation: 'The contrapositive of "P -> Q" is "not Q -> not P", which is logically equivalent to the original statement.'
        }
      ]
    }
  ];

  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, order_num, duration, summary, content, video_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (course_id, question, options_json, correct_index, explanation)
    VALUES (?, ?, ?, ?, ?)
  `);

  coursesData.forEach((c) => {
    const courseRes = insertCourse.run(
      c.title,
      c.slug,
      c.subject,
      c.level,
      c.description,
      c.instructor,
      c.duration,
      c.badge,
      c.image_color
    );
    const courseId = courseRes.lastInsertRowid;

    // Insert lessons
    c.lessons.forEach((l, idx) => {
      const videoUrl = lessonVideoUrls[c.slug]?.[idx] || null;
      insertLesson.run(courseId, l.title, idx + 1, l.duration, l.summary, l.content, videoUrl);
    });

    // Insert quizzes
    c.quizzes.forEach((q) => {
      insertQuiz.run(courseId, q.question, JSON.stringify(q.options), q.correct_index, q.explanation);
    });
  });

  // 3. Pre-enroll demo student into course 1 & 2 with sample progress
  const enroll = db.prepare(`
    INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)
  `);
  enroll.run(studentId, 1);
  enroll.run(studentId, 2);

  // Complete first 3 lessons of course 1
  const lessonsCourse1 = db.prepare('SELECT id FROM lessons WHERE course_id = 1 ORDER BY order_num ASC').all();
  const insertComp = db.prepare(`
    INSERT INTO lesson_completions (user_id, course_id, lesson_id) VALUES (?, ?, ?)
  `);
  if (lessonsCourse1.length >= 3) {
    insertComp.run(studentId, 1, lessonsCourse1[0].id);
    insertComp.run(studentId, 1, lessonsCourse1[1].id);
    insertComp.run(studentId, 1, lessonsCourse1[2].id);
  }

  // Pre-seed a quiz attempt for course 1
  db.prepare(`
    INSERT INTO quiz_attempts (user_id, course_id, score, total_questions, percentage)
    VALUES (?, ?, ?, ?, ?)
  `).run(studentId, 1, 3, 3, 100.0);

  console.log('Database successfully initialized and seeded!');
}

module.exports = {
  db,
  initDb,
  hashPassword,
  verifyPassword
};
