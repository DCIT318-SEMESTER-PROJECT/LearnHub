const db = require('../src/config/database');

async function seedDatabase() {
  console.log('🌱 Seeding database with courses, lessons, and quizzes...');

  try {
    // Check if courses already exist
    const existing = await db.getAsync('SELECT COUNT(*) as count FROM courses');
    if (existing.count > 0) {
      console.log('✅ Courses already exist, skipping seed.');
      return;
    }

    // ─── Courses with Lessons and Quizzes ───
    const courses = [
      {
        title: 'React Advanced Patterns',
        description: 'Master React hooks, context API, and advanced patterns to build scalable applications. Learn compound components, render props, and performance optimization techniques.',
        category: 'Web Development',
        difficultyLevel: 'Advanced',
        imageUrl: '⚛️',
        totalLessons: 12,
        instructorName: 'Sarah Johnson',
        duration: '12 hours',
        price: 0,
        isPublished: 1,
        prerequisites: 'Basic React knowledge',
        learningOutcomes: 'Build scalable React apps, Master advanced patterns, Optimize performance',
        quiz: {
          title: 'React Advanced Patterns Quiz',
          description: 'Test your knowledge of React advanced patterns',
          passingScore: 70,
          questions: [
            {
              question: 'Which hook is used for side effects in React?',
              option1: 'useState',
              option2: 'useEffect',
              option3: 'useContext',
              option4: 'useReducer',
              correctOption: 2
            },
            {
              question: 'What is the purpose of useCallback?',
              option1: 'Memoize functions',
              option2: 'Memoize values',
              option3: 'Create refs',
              option4: 'Handle errors',
              correctOption: 1
            },
            {
              question: 'Which pattern allows passing data through the component tree without prop drilling?',
              option1: 'Render Props',
              option2: 'Higher Order Components',
              option3: 'Context API',
              option4: 'Compound Components',
              correctOption: 3
            },
            {
              question: 'What is a Custom Hook?',
              option1: 'A built-in React hook',
              option2: 'A function that uses React hooks',
              option3: 'A component that renders hooks',
              option4: 'A library for state management',
              correctOption: 2
            }
          ]
        },
        lessons: [
          { title: 'Introduction to React Hooks', duration: '15 min', orderNumber: 1 },
          { title: 'useState and useEffect Deep Dive', duration: '25 min', orderNumber: 2 },
          { title: 'useContext for State Management', duration: '20 min', orderNumber: 3 },
          { title: 'useReducer and useCallback', duration: '30 min', orderNumber: 4 },
          { title: 'Custom Hooks Development', duration: '35 min', orderNumber: 5 },
          { title: 'React Context API Advanced', duration: '28 min', orderNumber: 6 },
          { title: 'Performance Optimization', duration: '40 min', orderNumber: 7 },
          { title: 'Code Splitting and Lazy Loading', duration: '25 min', orderNumber: 8 },
          { title: 'Error Boundaries', duration: '20 min', orderNumber: 9 },
          { title: 'Advanced Patterns Overview', duration: '30 min', orderNumber: 10 },
          { title: 'Compound Components', duration: '35 min', orderNumber: 11 },
          { title: 'Render Props Pattern', duration: '28 min', orderNumber: 12 }
        ]
      },
      {
        title: 'JavaScript Mastery',
        description: 'Complete JavaScript course from fundamentals to advanced concepts with practical projects and real-world examples.',
        category: 'Programming',
        difficultyLevel: 'Beginner',
        imageUrl: '📜',
        totalLessons: 15,
        instructorName: 'Michael Chen',
        duration: '20 hours',
        price: 0,
        isPublished: 1,
        prerequisites: 'None',
        learningOutcomes: 'Write clean JavaScript, Understand ES6+, Build projects',
        quiz: {
          title: 'JavaScript Mastery Quiz',
          description: 'Test your JavaScript knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'What is the correct way to declare a variable in JavaScript?',
              option1: 'var',
              option2: 'let',
              option3: 'const',
              option4: 'All of the above',
              correctOption: 4
            },
            {
              question: 'Which method is used to add an element to the end of an array?',
              option1: 'push()',
              option2: 'pop()',
              option3: 'shift()',
              option4: 'unshift()',
              correctOption: 1
            },
            {
              question: 'What does the "this" keyword refer to in JavaScript?',
              option1: 'The current function',
              option2: 'The global object',
              option3: 'The object that called the function',
              option4: 'The parent object',
              correctOption: 3
            },
            {
              question: 'What is a Promise in JavaScript?',
              option1: 'A function that returns a value',
              option2: 'An object representing the eventual completion of an async operation',
              option3: 'A type of loop',
              option4: 'A way to declare variables',
              correctOption: 2
            }
          ]
        },
        lessons: [
          { title: 'JavaScript Fundamentals', duration: '20 min', orderNumber: 1 },
          { title: 'Variables and Data Types', duration: '25 min', orderNumber: 2 },
          { title: 'Functions and Scope', duration: '30 min', orderNumber: 3 },
          { title: 'Arrays and Objects', duration: '25 min', orderNumber: 4 },
          { title: 'DOM Manipulation', duration: '35 min', orderNumber: 5 },
          { title: 'ES6 Features', duration: '30 min', orderNumber: 6 },
          { title: 'Promises and Async/Await', duration: '35 min', orderNumber: 7 },
          { title: 'Working with APIs', duration: '40 min', orderNumber: 8 },
          { title: 'Error Handling', duration: '20 min', orderNumber: 9 },
          { title: 'Modules and Imports', duration: '25 min', orderNumber: 10 },
          { title: 'JavaScript Design Patterns', duration: '35 min', orderNumber: 11 },
          { title: 'Testing JavaScript', duration: '30 min', orderNumber: 12 },
          { title: 'Performance Optimization', duration: '25 min', orderNumber: 13 },
          { title: 'Building a Todo App', duration: '45 min', orderNumber: 14 },
          { title: 'Final Project', duration: '50 min', orderNumber: 15 }
        ]
      },
      {
        title: 'Data Science Fundamentals',
        description: 'Learn Python, statistics, and machine learning basics with hands-on projects and real datasets.',
        category: 'Data Science',
        difficultyLevel: 'Intermediate',
        imageUrl: '📊',
        totalLessons: 14,
        instructorName: 'Dr. Emily Roberts',
        duration: '15 hours',
        price: 49,
        isPublished: 1,
        prerequisites: 'Basic programming knowledge',
        learningOutcomes: 'Analyze data, Build ML models, Visualize insights',
        quiz: {
          title: 'Data Science Fundamentals Quiz',
          description: 'Test your data science knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'Which Python library is used for data manipulation?',
              option1: 'NumPy',
              option2: 'Pandas',
              option3: 'Matplotlib',
              option4: 'Scikit-learn',
              correctOption: 2
            },
            {
              question: 'What is supervised learning?',
              option1: 'Learning without labels',
              option2: 'Learning with labeled data',
              option3: 'Learning from rewards',
              option4: 'Learning from patterns',
              correctOption: 2
            },
            {
              question: 'Which method is used to handle missing data in Pandas?',
              option1: 'dropna()',
              option2: 'fillna()',
              option3: 'Both A and B',
              option4: 'None of the above',
              correctOption: 3
            },
            {
              question: 'What is the purpose of Matplotlib?',
              option1: 'Data manipulation',
              option2: 'Data visualization',
              option3: 'Machine learning',
              option4: 'Web development',
              correctOption: 2
            }
          ]
        },
        lessons: [
          { title: 'Introduction to Data Science', duration: '20 min', orderNumber: 1 },
          { title: 'Python Basics for Data Science', duration: '35 min', orderNumber: 2 },
          { title: 'NumPy and Pandas', duration: '40 min', orderNumber: 3 },
          { title: 'Data Visualization with Matplotlib', duration: '30 min', orderNumber: 4 },
          { title: 'Data Cleaning and Preprocessing', duration: '35 min', orderNumber: 5 },
          { title: 'Exploratory Data Analysis', duration: '30 min', orderNumber: 6 },
          { title: 'Statistical Analysis', duration: '40 min', orderNumber: 7 },
          { title: 'Introduction to Machine Learning', duration: '35 min', orderNumber: 8 },
          { title: 'Supervised Learning', duration: '45 min', orderNumber: 9 },
          { title: 'Unsupervised Learning', duration: '35 min', orderNumber: 10 },
          { title: 'Model Evaluation', duration: '30 min', orderNumber: 11 },
          { title: 'Feature Engineering', duration: '25 min', orderNumber: 12 },
          { title: 'Building a Predictive Model', duration: '40 min', orderNumber: 13 },
          { title: 'Final Project', duration: '50 min', orderNumber: 14 }
        ]
      },
      {
        title: 'UI/UX Design Principles',
        description: 'Master user interface and user experience design fundamentals with practical exercises and real-world case studies.',
        category: 'Design',
        difficultyLevel: 'Beginner',
        imageUrl: '🎨',
        totalLessons: 10,
        instructorName: 'Alex Rivera',
        duration: '10 hours',
        price: 0,
        isPublished: 1,
        prerequisites: 'None',
        learningOutcomes: 'Design user-friendly interfaces, Create prototypes, Conduct user research',
        quiz: {
          title: 'UI/UX Design Principles Quiz',
          description: 'Test your UI/UX design knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'What is the difference between UI and UX?',
              option1: 'They are the same thing',
              option2: 'UI is visual design, UX is user experience',
              option3: 'UI is user experience, UX is visual design',
              option4: 'UI is coding, UX is design',
              correctOption: 2
            },
            {
              question: 'What is a user persona?',
              option1: 'A real user of the product',
              option2: 'A fictional character representing a user type',
              option3: 'A design tool',
              option4: 'A type of wireframe',
              correctOption: 2
            },
            {
              question: 'What is a wireframe?',
              option1: 'A final design',
              option2: 'A low-fidelity layout of a page',
              option3: 'A color scheme',
              option4: 'A type of font',
              correctOption: 2
            },
            {
              question: 'Why is user research important?',
              option1: 'It helps understand user needs',
              option2: 'It saves money',
              option3: 'It makes the design look better',
              option4: 'It is required by law',
              correctOption: 1
            }
          ]
        },
        lessons: [
          { title: 'Introduction to UI/UX Design', duration: '15 min', orderNumber: 1 },
          { title: 'Understanding User Research', duration: '25 min', orderNumber: 2 },
          { title: 'User Personas and Journey Maps', duration: '30 min', orderNumber: 3 },
          { title: 'Wireframing and Prototyping', duration: '35 min', orderNumber: 4 },
          { title: 'Visual Design Principles', duration: '30 min', orderNumber: 5 },
          { title: 'Color Theory and Typography', duration: '25 min', orderNumber: 6 },
          { title: 'Interaction Design', duration: '30 min', orderNumber: 7 },
          { title: 'Usability Testing', duration: '25 min', orderNumber: 8 },
          { title: 'Design Systems', duration: '30 min', orderNumber: 9 },
          { title: 'Final Project', duration: '45 min', orderNumber: 10 }
        ]
      },
      {
        title: 'Python for Data Analysis',
        description: 'Learn Python programming with focus on data analysis, visualization, and manipulation using Pandas and NumPy.',
        category: 'Data Science',
        difficultyLevel: 'Intermediate',
        imageUrl: '🐍',
        totalLessons: 13,
        instructorName: 'Dr. Emily Roberts',
        duration: '18 hours',
        price: 49,
        isPublished: 1,
        prerequisites: 'Basic Python knowledge',
        learningOutcomes: 'Clean and analyze data, Create visualizations, Build data pipelines',
        quiz: {
          title: 'Python for Data Analysis Quiz',
          description: 'Test your Python data analysis skills',
          passingScore: 70,
          questions: [
            {
              question: 'Which library is used for data manipulation in Python?',
              option1: 'Matplotlib',
              option2: 'Pandas',
              option3: 'NumPy',
              option4: 'SciPy',
              correctOption: 2
            },
            {
              question: 'What is the function to read a CSV file in Pandas?',
              option1: 'csv.read()',
              option2: 'pd.read_csv()',
              option3: 'pd.load_csv()',
              option4: 'pd.import_csv()',
              correctOption: 2
            },
            {
              question: 'Which method is used to view the first few rows of a DataFrame?',
              option1: 'df.head()',
              option2: 'df.tail()',
              option3: 'df.view()',
              option4: 'df.first()',
              correctOption: 1
            },
            {
              question: 'What is the purpose of seaborn in data visualization?',
              option1: 'Statistical data visualization',
              option2: 'Machine learning',
              option3: 'Web scraping',
              option4: 'Data cleaning',
              correctOption: 1
            }
          ]
        },
        lessons: [
          { title: 'Python Fundamentals Review', duration: '25 min', orderNumber: 1 },
          { title: 'Working with Pandas DataFrames', duration: '35 min', orderNumber: 2 },
          { title: 'Data Cleaning with Pandas', duration: '30 min', orderNumber: 3 },
          { title: 'Data Visualization with Seaborn', duration: '35 min', orderNumber: 4 },
          { title: 'Exploratory Data Analysis', duration: '40 min', orderNumber: 5 },
          { title: 'Time Series Analysis', duration: '30 min', orderNumber: 6 },
          { title: 'Statistical Analysis with Python', duration: '35 min', orderNumber: 7 },
          { title: 'Web Scraping with BeautifulSoup', duration: '40 min', orderNumber: 8 },
          { title: 'Working with APIs in Python', duration: '30 min', orderNumber: 9 },
          { title: 'Data Visualization with Plotly', duration: '35 min', orderNumber: 10 },
          { title: 'Machine Learning with Scikit-learn', duration: '45 min', orderNumber: 11 },
          { title: 'Deploying Data Projects', duration: '30 min', orderNumber: 12 },
          { title: 'Final Project', duration: '50 min', orderNumber: 13 }
        ]
      },
      {
        title: 'Full Stack Web Development',
        description: 'Complete full-stack development with React, Node.js, and MongoDB. Build real-world applications from scratch.',
        category: 'Web Development',
        difficultyLevel: 'Advanced',
        imageUrl: '🌐',
        totalLessons: 16,
        instructorName: 'Sarah Johnson',
        duration: '25 hours',
        price: 79,
        isPublished: 1,
        prerequisites: 'JavaScript and React basics',
        learningOutcomes: 'Build full-stack apps, Deploy to production, Implement authentication',
        quiz: {
          title: 'Full Stack Web Development Quiz',
          description: 'Test your full-stack development knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'What is the purpose of Node.js?',
              option1: 'Frontend framework',
              option2: 'Server-side JavaScript runtime',
              option3: 'Database system',
              option4: 'CSS preprocessor',
              correctOption: 2
            },
            {
              question: 'Which database is commonly used with the MERN stack?',
              option1: 'MySQL',
              option2: 'PostgreSQL',
              option3: 'MongoDB',
              option4: 'SQLite',
              correctOption: 3
            },
            {
              question: 'What is JWT used for?',
              option1: 'Database queries',
              option2: 'Authentication',
              option3: 'Styling',
              option4: 'Deployment',
              correctOption: 2
            },
            {
              question: 'Which framework is used for building APIs in Node.js?',
              option1: 'React',
              option2: 'Angular',
              option3: 'Express.js',
              option4: 'Django',
              correctOption: 3
            }
          ]
        },
        lessons: [
          { title: 'Full Stack Overview', duration: '20 min', orderNumber: 1 },
          { title: 'React Frontend Setup', duration: '30 min', orderNumber: 2 },
          { title: 'Building React Components', duration: '35 min', orderNumber: 3 },
          { title: 'State Management in React', duration: '35 min', orderNumber: 4 },
          { title: 'Node.js Backend Setup', duration: '30 min', orderNumber: 5 },
          { title: 'Express.js API Development', duration: '40 min', orderNumber: 6 },
          { title: 'MongoDB Database Design', duration: '35 min', orderNumber: 7 },
          { title: 'CRUD Operations', duration: '40 min', orderNumber: 8 },
          { title: 'Authentication with JWT', duration: '45 min', orderNumber: 9 },
          { title: 'Protected Routes', duration: '35 min', orderNumber: 10 },
          { title: 'Connecting Frontend to Backend', duration: '30 min', orderNumber: 11 },
          { title: 'Deploying Full Stack App', duration: '40 min', orderNumber: 12 },
          { title: 'Error Handling', duration: '30 min', orderNumber: 13 },
          { title: 'Testing and Debugging', duration: '35 min', orderNumber: 14 },
          { title: 'Performance Optimization', duration: '30 min', orderNumber: 15 },
          { title: 'Final Project', duration: '50 min', orderNumber: 16 }
        ]
      },
      {
        title: 'Machine Learning A-Z',
        description: 'Learn machine learning algorithms, neural networks, and AI concepts with practical implementations.',
        category: 'Data Science',
        difficultyLevel: 'Advanced',
        imageUrl: '🤖',
        totalLessons: 15,
        instructorName: 'Dr. Emily Roberts',
        duration: '22 hours',
        price: 69,
        isPublished: 1,
        prerequisites: 'Python and statistics',
        learningOutcomes: 'Implement ML algorithms, Build neural networks, Deploy ML models',
        quiz: {
          title: 'Machine Learning A-Z Quiz',
          description: 'Test your machine learning knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'What is the difference between supervised and unsupervised learning?',
              option1: 'Supervised uses labeled data, unsupervised uses unlabeled data',
              option2: 'Supervised is faster than unsupervised',
              option3: 'Unsupervised uses neural networks',
              option4: 'There is no difference',
              correctOption: 1
            },
            {
              question: 'What is a neural network?',
              option1: 'A type of database',
              option2: 'A machine learning model inspired by the brain',
              option3: 'A programming language',
              option4: 'A web framework',
              correctOption: 2
            },
            {
              question: 'Which algorithm is used for classification tasks?',
              option1: 'Linear Regression',
              option2: 'Logistic Regression',
              option3: 'K-Means',
              option4: 'PCA',
              correctOption: 2
            },
            {
              question: 'What is the purpose of TensorFlow?',
              option1: 'Web development',
              option2: 'Deep learning framework',
              option3: 'Data visualization',
              option4: 'Database management',
              correctOption: 2
            }
          ]
        },
        lessons: [
          { title: 'Machine Learning Basics', duration: '25 min', orderNumber: 1 },
          { title: 'Linear Regression', duration: '35 min', orderNumber: 2 },
          { title: 'Logistic Regression', duration: '30 min', orderNumber: 3 },
          { title: 'Decision Trees and Random Forests', duration: '40 min', orderNumber: 4 },
          { title: 'Support Vector Machines', duration: '35 min', orderNumber: 5 },
          { title: 'Naive Bayes Classifier', duration: '30 min', orderNumber: 6 },
          { title: 'Clustering Algorithms', duration: '35 min', orderNumber: 7 },
          { title: 'Dimensionality Reduction', duration: '30 min', orderNumber: 8 },
          { title: 'Neural Networks Introduction', duration: '40 min', orderNumber: 9 },
          { title: 'Deep Learning with TensorFlow', duration: '45 min', orderNumber: 10 },
          { title: 'Natural Language Processing', duration: '40 min', orderNumber: 11 },
          { title: 'Computer Vision Basics', duration: '35 min', orderNumber: 12 },
          { title: 'Reinforcement Learning', duration: '35 min', orderNumber: 13 },
          { title: 'Model Deployment', duration: '30 min', orderNumber: 14 },
          { title: 'Final Project', duration: '50 min', orderNumber: 15 }
        ]
      },
      {
        title: 'CSS Mastery',
        description: 'Master CSS with flexbox, grid, animations, and responsive design. Build stunning, modern websites.',
        category: 'Web Development',
        difficultyLevel: 'Beginner',
        imageUrl: '🎨',
        totalLessons: 9,
        instructorName: 'Alex Rivera',
        duration: '8 hours',
        price: 0,
        isPublished: 1,
        prerequisites: 'Basic HTML knowledge',
        learningOutcomes: 'Build responsive layouts, Create animations, Master modern CSS',
        quiz: {
          title: 'CSS Mastery Quiz',
          description: 'Test your CSS knowledge',
          passingScore: 70,
          questions: [
            {
              question: 'What is the difference between flexbox and grid?',
              option1: 'Flexbox is for 1D layouts, grid is for 2D layouts',
              option2: 'Grid is for 1D layouts, flexbox is for 2D layouts',
              option3: 'They are the same thing',
              option4: 'Flexbox is for mobile, grid is for desktop',
              correctOption: 1
            },
            {
              question: 'Which CSS property is used for responsive design?',
              option1: 'flexbox',
              option2: 'grid',
              option3: 'media queries',
              option4: 'animations',
              correctOption: 3
            },
            {
              question: 'What is the purpose of CSS animations?',
              option1: 'To add interactivity to elements',
              option2: 'To style elements',
              option3: 'To create layouts',
              option4: 'To handle user events',
              correctOption: 1
            },
            {
              question: 'Which CSS preprocessor is commonly used?',
              option1: 'Sass',
              option2: 'Less',
              option3: 'Stylus',
              option4: 'All of the above',
              correctOption: 4
            }
          ]
        },
        lessons: [
          { title: 'CSS Fundamentals', duration: '20 min', orderNumber: 1 },
          { title: 'Flexbox Layout', duration: '35 min', orderNumber: 2 },
          { title: 'CSS Grid Layout', duration: '35 min', orderNumber: 3 },
          { title: 'Responsive Design', duration: '30 min', orderNumber: 4 },
          { title: 'CSS Animations and Transitions', duration: '30 min', orderNumber: 5 },
          { title: 'Advanced Selectors', duration: '25 min', orderNumber: 6 },
          { title: 'CSS Variables', duration: '20 min', orderNumber: 7 },
          { title: 'Sass and CSS Preprocessors', duration: '35 min', orderNumber: 8 },
          { title: 'Final Project', duration: '40 min', orderNumber: 9 }
        ]
      }
    ];

    // ─── Insert Data ───
    for (const course of courses) {
      // Insert course
      const result = await db.runAsync(
        `INSERT INTO courses (
          title, description, category, difficultyLevel, imageUrl, 
          totalLessons, instructorName, duration, price, isPublished,
          prerequisites, learningOutcomes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.title, course.description, course.category, course.difficultyLevel,
          course.imageUrl, course.totalLessons, course.instructorName,
          course.duration, course.price, course.isPublished,
          course.prerequisites, course.learningOutcomes
        ]
      );

      const courseId = result.lastID;

      // Insert lessons
      for (const lesson of course.lessons) {
        await db.runAsync(
          `INSERT INTO lessons (courseId, title, duration, orderNumber, isFree)
           VALUES (?, ?, ?, ?, ?)`,
          [courseId, lesson.title, lesson.duration, lesson.orderNumber, 1]
        );
      }

      // Insert quiz if exists
      if (course.quiz) {
        const quizResult = await db.runAsync(
          `INSERT INTO quizzes (courseId, title, description, passingScore, timeLimitMinutes)
           VALUES (?, ?, ?, ?, ?)`,
          [courseId, course.quiz.title, course.quiz.description, course.quiz.passingScore, 10]
        );
        
        const quizId = quizResult.lastID;

        // Insert quiz questions
        for (const question of course.quiz.questions) {
          await db.runAsync(
            `INSERT INTO quiz_questions (
              quizId, question, option1, option2, option3, option4, correctOption
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              quizId, question.question, question.option1, 
              question.option2, question.option3, question.option4, 
              question.correctOption
            ]
          );
        }
        console.log(`📝 Added quiz for: ${course.title}`);
      }

      console.log(`✅ Added course: ${course.title} with ${course.lessons.length} lessons`);
    }

    // ─── Add Sample Study Groups ───
    const studyGroups = [
      {
        name: 'React Advanced Patterns Study Group',
        description: 'Weekly study sessions for mastering React advanced patterns. We meet every Tuesday at 7 PM.',
        courseId: 1,
        createdBy: 1,
        maxMembers: 20,
        meetingSchedule: 'Tuesdays 7 PM EST'
      },
      {
        name: 'JavaScript Mastery Squad',
        description: 'Daily coding challenges and weekly code reviews. Join us to master JavaScript!',
        courseId: 2,
        createdBy: 1,
        maxMembers: 25,
        meetingSchedule: 'Wednesdays 6 PM EST'
      },
      {
        name: 'Data Science Study Squad',
        description: 'Hands-on data science projects and study sessions. All levels welcome!',
        courseId: 3,
        createdBy: 1,
        maxMembers: 20,
        meetingSchedule: 'Thursdays 8 PM EST'
      }
    ];

    for (const group of studyGroups) {
      await db.runAsync(
        `INSERT INTO study_groups (name, description, courseId, createdBy, maxMembers, meetingSchedule)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [group.name, group.description, group.courseId, group.createdBy, group.maxMembers, group.meetingSchedule]
      );
      console.log(`👥 Added study group: ${group.name}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Added ${courses.length} courses, ${courses.reduce((acc, c) => acc + c.lessons.length, 0)} lessons, and ${studyGroups.length} study groups`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log('🎉 Seed script finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });