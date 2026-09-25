const db = require('../config/database');

class Course {
  static async findAll() {
    const courses = await db.allAsync('SELECT * FROM courses WHERE isPublished = 1');
    
    for (let course of courses) {
      const result = await db.getAsync(
        'SELECT COUNT(*) as count FROM enrollments WHERE courseId = ?',
        [course.id]
      );
      course.totalReviews = result ? result.count : 0;
    }
    
    return courses;
  }

  static async findById(id) {
  const course = await db.getAsync('SELECT * FROM courses WHERE id = ? AND isPublished = 1', [id]);
  if (!course) return null;

  const result = await db.getAsync(
    'SELECT COUNT(*) as count FROM enrollments WHERE courseId = ?',
    [course.id]
  );
  course.totalReviews = result ? result.count : 0;

  // Fetch quiz if it exists
  const quiz = await db.getAsync(
    'SELECT * FROM quizzes WHERE courseId = ? ORDER BY id DESC LIMIT 1',
    [course.id]
  );

  if (quiz) {
    const questions = await db.allAsync(
      'SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderNumber ASC, id ASC',
      [quiz.id]
    );
    course.quiz = { id: quiz.id, title: quiz.title, questions };
  } else {
    course.quiz = null;
  }

  return course;
}
  static async getLessons(courseId) {
    return await db.allAsync(
      'SELECT * FROM lessons WHERE courseId = ? ORDER BY orderNumber',
      [courseId]
    );
  }

  static async getLessonById(lessonId) {
    return await db.getAsync('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  }

  static async getEnrollment(userId, courseId) {
    return await db.getAsync(
      'SELECT * FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
  }

  static async enrollUser(userId, courseId) {
    const existing = await this.getEnrollment(userId, courseId);
    if (existing) return null;

    const result = await db.runAsync(
      `INSERT INTO enrollments (userId, courseId, enrolledAt) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [userId, courseId]
    );
    return result.lastID;
  }

  static async unenrollUser(userId, courseId) {
    await db.runAsync(
      'DELETE FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
  }

  static async getLessonProgress(userId, lessonId) {
    return await db.getAsync(
      'SELECT * FROM lesson_progress WHERE userId = ? AND lessonId = ?',
      [userId, lessonId]
    );
  }

  static async updateLessonProgress(userId, lessonId, completed, watchTime = 0) {
    const existing = await this.getLessonProgress(userId, lessonId);
    
    if (existing) {
      await db.runAsync(
        `UPDATE lesson_progress 
         SET isCompleted = ?, 
             completedAt = ?, 
             watchTimeSeconds = watchTimeSeconds + ?
         WHERE userId = ? AND lessonId = ?`,
        [completed, completed ? new Date().toISOString() : null, watchTime, userId, lessonId]
      );
    } else {
      await db.runAsync(
        `INSERT INTO lesson_progress (userId, lessonId, isCompleted, completedAt, watchTimeSeconds) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, lessonId, completed, completed ? new Date().toISOString() : null, watchTime]
      );
    }

    await this.updateCourseProgress(userId, lessonId);
  }

  static async updateCourseProgress(userId, lessonId) {
    const lesson = await db.getAsync('SELECT courseId FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return;

    const courseId = lesson.courseId;

    const totalLessons = await db.getAsync(
      'SELECT COUNT(*) as count FROM lessons WHERE courseId = ?',
      [courseId]
    );

    const completedLessons = await db.getAsync(
      `SELECT COUNT(*) as count FROM lesson_progress lp
       JOIN lessons l ON lp.lessonId = l.id
       WHERE lp.userId = ? AND l.courseId = ? AND lp.isCompleted = 1`,
      [userId, courseId]
    );

    const totalCount = totalLessons ? totalLessons.count : 0;
    const completedCount = completedLessons ? completedLessons.count : 0;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isCompleted = progress === 100 && totalCount > 0;

    await db.runAsync(
      `UPDATE enrollments 
       SET progressPercentage = ?, 
           isCompleted = ?, 
           completedAt = ?,
           completedLessons = ?
       WHERE userId = ? AND courseId = ?`,
      [progress, isCompleted, isCompleted ? new Date().toISOString() : null, completedCount, userId, courseId]
    );
  }

  static async getUserEnrollments(userId) {
    return await db.allAsync(
      `SELECT e.*, c.title, c.imageUrl, c.duration, c.instructorName 
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE e.userId = ?`,
      [userId]
    );
  }

  // ═══════════════════════════════════════════════════
  // INSTRUCTOR COURSE MANAGEMENT
  // ═══════════════════════════════════════════════════

  static async createByInstructor(instructorId, data) {
    const {
      title,
      description,
      category = 'Web Development',
      difficultyLevel = 'Beginner',
      duration = '0 hours',
      price = 0,
      prerequisites = '',
      learningOutcomes = '',
      imageUrl = '',
      isPublished = 0,
      instructorName = ''
    } = data;

    const result = await db.runAsync(
      `INSERT INTO courses (
        title, description, category, difficultyLevel, imageUrl,
        totalLessons, instructorId, instructorName, duration, price, isPublished,
        prerequisites, learningOutcomes
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, category, difficultyLevel, imageUrl,
        instructorId, instructorName, duration, price, isPublished,
        prerequisites, learningOutcomes
      ]
    );

    return result.lastID;
  }

  static async updateByInstructor(courseId, instructorId, data) {
    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, instructorId]
    );
    if (!course) throw new Error('Course not found or not owned by you');

    const fields = [];
    const values = [];

    const allowed = [
      'title', 'description', 'category', 'difficultyLevel',
      'duration', 'price', 'prerequisites',
      'learningOutcomes', 'imageUrl', 'isPublished'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return course;

    values.push(courseId, instructorId);
    await db.runAsync(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ? AND instructorId = ?`,
      values
    );

    return await db.getAsync('SELECT * FROM courses WHERE id = ?', [courseId]);
  }

  static async deleteByInstructor(courseId, instructorId) {
    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, instructorId]
    );
    if (!course) throw new Error('Course not found or not owned by you');

    await db.runAsync('DELETE FROM lessons WHERE courseId = ?', [courseId]);
    await db.runAsync('DELETE FROM course_modules WHERE courseId = ?', [courseId]);
    await db.runAsync('DELETE FROM enrollments WHERE courseId = ?', [courseId]);
    await db.runAsync('DELETE FROM courses WHERE id = ? AND instructorId = ?', [courseId, instructorId]);
  }

  static async getModules(courseId) {
    return await db.allAsync(
      'SELECT * FROM course_modules WHERE courseId = ? ORDER BY orderNumber ASC',
      [courseId]
    );
  }

  static async getModulesWithLessons(courseId) {
    const modules = await this.getModules(courseId);
    for (const mod of modules) {
      mod.lessons = await db.allAsync(
        'SELECT * FROM lessons WHERE moduleId = ? ORDER BY orderNumber ASC',
        [mod.id]
      );
    }
    const orphanLessons = await db.allAsync(
      'SELECT * FROM lessons WHERE courseId = ? AND (moduleId IS NULL OR moduleId = 0) ORDER BY orderNumber ASC',
      [courseId]
    );
    return { modules, orphanLessons };
  }

  static async addModule(courseId, instructorId, data) {
    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, instructorId]
    );
    if (!course) throw new Error('Course not found or not owned by you');

    const last = await db.getAsync(
      'SELECT MAX(orderNumber) as maxOrder FROM course_modules WHERE courseId = ?',
      [courseId]
    );
    const orderNumber = (last?.maxOrder || 0) + 1;

    const result = await db.runAsync(
      `INSERT INTO course_modules (courseId, title, description, orderNumber)
       VALUES (?, ?, ?, ?)`,
      [courseId, data.title, data.description || '', orderNumber]
    );

    return {
      id: result.lastID,
      courseId,
      title: data.title,
      description: data.description || '',
      orderNumber,
      lessons: []
    };
  }

  static async updateModule(moduleId, instructorId, data) {
    const mod = await db.getAsync(
      `SELECT cm.* FROM course_modules cm
       JOIN courses c ON cm.courseId = c.id
       WHERE cm.id = ? AND c.instructorId = ?`,
      [moduleId, instructorId]
    );
    if (!mod) throw new Error('Module not found or not owned by you');

    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.orderNumber !== undefined) { fields.push('orderNumber = ?'); values.push(data.orderNumber); }

    if (fields.length === 0) return mod;

    values.push(moduleId);
    await db.runAsync(
      `UPDATE course_modules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return await db.getAsync('SELECT * FROM course_modules WHERE id = ?', [moduleId]);
  }

  static async deleteModule(moduleId, instructorId) {
    const mod = await db.getAsync(
      `SELECT cm.* FROM course_modules cm
       JOIN courses c ON cm.courseId = c.id
       WHERE cm.id = ? AND c.instructorId = ?`,
      [moduleId, instructorId]
    );
    if (!mod) throw new Error('Module not found or not owned by you');

    await db.runAsync('UPDATE lessons SET moduleId = NULL WHERE moduleId = ?', [moduleId]);
    await db.runAsync('DELETE FROM course_modules WHERE id = ?', [moduleId]);
  }

  static async addLesson(courseId, instructorId, data) {
    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, instructorId]
    );
    if (!course) throw new Error('Course not found or not owned by you');

    const {
      moduleId = null,
      title,
      description = '',
      videoUrl = '',
      content = '',
      duration = '10 min',
      orderNumber = null,
      isFree = 1
    } = data;

    let finalOrder = orderNumber;
    if (finalOrder === null) {
      const last = await db.getAsync(
        `SELECT MAX(orderNumber) as maxOrder FROM lessons 
         WHERE courseId = ? AND moduleId IS ?`,
        [courseId, moduleId]
      );
      finalOrder = (last?.maxOrder || 0) + 1;
    }

    const result = await db.runAsync(
      `INSERT INTO lessons (
        courseId, moduleId, title, description, videoUrl, content,
        orderNumber, duration, isFree
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId, moduleId, title, description, videoUrl, content,
        finalOrder, duration, isFree
      ]
    );

    const count = await db.getAsync(
      'SELECT COUNT(*) as count FROM lessons WHERE courseId = ?',
      [courseId]
    );
    await db.runAsync(
      'UPDATE courses SET totalLessons = ? WHERE id = ?',
      [count.count, courseId]
    );

    return {
      id: result.lastID,
      courseId,
      moduleId,
      title,
      description,
      videoUrl,
      content,
      duration,
      orderNumber: finalOrder,
      isFree
    };
  }

  static async updateLesson(lessonId, instructorId, data) {
    const lesson = await db.getAsync(
      `SELECT l.* FROM lessons l
       JOIN courses c ON l.courseId = c.id
       WHERE l.id = ? AND c.instructorId = ?`,
      [lessonId, instructorId]
    );
    if (!lesson) throw new Error('Lesson not found or not owned by you');

    const fields = [];
    const values = [];
    const allowed = ['title', 'description', 'videoUrl', 'content', 'duration', 'orderNumber', 'isFree', 'moduleId'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return lesson;

    values.push(lessonId);
    await db.runAsync(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, values);
    return await db.getAsync('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  }

  static async deleteLesson(lessonId, instructorId) {
    const lesson = await db.getAsync(
      `SELECT l.* FROM lessons l
       JOIN courses c ON l.courseId = c.id
       WHERE l.id = ? AND c.instructorId = ?`,
      [lessonId, instructorId]
    );
    if (!lesson) throw new Error('Lesson not found or not owned by you');

    await db.runAsync('DELETE FROM lessons WHERE id = ?', [lessonId]);

    const count = await db.getAsync(
      'SELECT COUNT(*) as count FROM lessons WHERE courseId = ?',
      [lesson.courseId]
    );
    await db.runAsync(
      'UPDATE courses SET totalLessons = ? WHERE id = ?',
      [count.count, lesson.courseId]
    );
  }

  static async getInstructorCourses(instructorId) {
    return await db.allAsync(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as students
       FROM courses c
       WHERE c.instructorId = ?
       ORDER BY c.createdAt DESC`,
      [instructorId]
    );
  }

  static async getCourseForEdit(courseId, instructorId) {
    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, instructorId]
    );
    if (!course) return null;

    const { modules, orphanLessons } = await this.getModulesWithLessons(courseId);
    return { ...course, modules, orphanLessons };
  }
}

module.exports = Course;