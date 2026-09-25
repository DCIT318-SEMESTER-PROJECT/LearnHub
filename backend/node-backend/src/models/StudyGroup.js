const db = require('../config/database');

class StudyGroup {
  static async findAll() {
    const groups = await db.allAsync(
      `SELECT sg.*,
              c.title as courseTitle,
              c.imageUrl as courseImageUrl,
              c.difficultyLevel as courseLevel,
              u.firstName as creatorFirstName,
              u.lastName  as creatorLastName,
              (SELECT COUNT(*) FROM study_group_members WHERE studyGroupId = sg.id) as members
       FROM study_groups sg
       LEFT JOIN courses c ON sg.courseId = c.id
       LEFT JOIN users u ON sg.createdBy = u.id
       WHERE sg.isActive = 1
       ORDER BY sg.createdAt DESC`
    );
    return groups;
  }

  static async findById(id) {
    return await db.getAsync(
      `SELECT sg.*,
              c.title as courseTitle,
              c.imageUrl as courseImageUrl,
              c.difficultyLevel as courseLevel,
              u.firstName as creatorFirstName,
              u.lastName  as creatorLastName,
              (SELECT COUNT(*) FROM study_group_members WHERE studyGroupId = sg.id) as members
       FROM study_groups sg
       LEFT JOIN courses c ON sg.courseId = c.id
       LEFT JOIN users u ON sg.createdBy = u.id
       WHERE sg.id = ? AND sg.isActive = 1`,
      [id]
    );
  }

  static async findByCourse(courseId) {
    return await db.allAsync(
      `SELECT sg.*,
              (SELECT COUNT(*) FROM study_group_members WHERE studyGroupId = sg.id) as members
       FROM study_groups sg
       WHERE sg.courseId = ? AND sg.isActive = 1
       ORDER BY sg.createdAt DESC`,
      [courseId]
    );
  }

  static async findMyGroups(userId) {
    return await db.allAsync(
      `SELECT sg.*,
              c.title as courseTitle,
              c.imageUrl as courseImageUrl,
              (SELECT COUNT(*) FROM study_group_members WHERE studyGroupId = sg.id) as members,
              sgm.isAdmin
       FROM study_groups sg
       JOIN study_group_members sgm ON sgm.studyGroupId = sg.id
       LEFT JOIN courses c ON sg.courseId = c.id
       WHERE sgm.userId = ? AND sg.isActive = 1
       ORDER BY sgm.joinedAt DESC`,
      [userId]
    );
  }

  static async create(groupData) {
    const { name, description, courseId, createdBy, maxMembers, meetingSchedule } = groupData;
    const result = await db.runAsync(
      `INSERT INTO study_groups (name, description, courseId, createdBy, maxMembers, meetingSchedule)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, courseId, createdBy, maxMembers || 20, meetingSchedule || '']
    );
    return result.lastID;
  }

  static async joinGroup(studyGroupId, userId) {
    const existing = await db.getAsync(
      'SELECT * FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [studyGroupId, userId]
    );
    if (existing) return null;

    const memberCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_group_members WHERE studyGroupId = ?',
      [studyGroupId]
    );
    const group = await this.findById(studyGroupId);
    if (!group) throw new Error('Group not found');
    if (memberCount.count >= group.maxMembers) throw new Error('Group is full');

    const result = await db.runAsync(
      'INSERT INTO study_group_members (studyGroupId, userId) VALUES (?, ?)',
      [studyGroupId, userId]
    );
    return result.lastID;
  }

  static async leaveGroup(studyGroupId, userId) {
    const adminCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_group_members WHERE studyGroupId = ? AND isAdmin = 1',
      [studyGroupId]
    );
    const isAdmin = await db.getAsync(
      'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [studyGroupId, userId]
    );
    if (isAdmin && isAdmin.isAdmin && adminCount.count === 1) {
      throw new Error('Cannot leave as the only admin. Transfer admin role first.');
    }
    await db.runAsync(
      'DELETE FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [studyGroupId, userId]
    );
  }

  static async isMember(studyGroupId, userId) {
    const result = await db.getAsync(
      'SELECT * FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [studyGroupId, userId]
    );
    return !!result;
  }

  static async getMembers(studyGroupId) {
    return await db.allAsync(
      `SELECT u.id, u.firstName, u.lastName, u.email, u.avatarUrl, sgm.isAdmin, sgm.joinedAt
       FROM study_group_members sgm
       JOIN users u ON sgm.userId = u.id
       WHERE sgm.studyGroupId = ?
       ORDER BY sgm.isAdmin DESC, sgm.joinedAt ASC`,
      [studyGroupId]
    );
  }

  static async getMessages(studyGroupId, limit = 50) {
    return await db.allAsync(
      `SELECT m.*, u.firstName, u.lastName, u.email, u.avatarUrl
       FROM study_group_messages m
       JOIN users u ON m.userId = u.id
       WHERE m.studyGroupId = ?
       ORDER BY m.sentAt DESC
       LIMIT ?`,
      [studyGroupId, limit]
    );
  }

  static async addMessage(studyGroupId, userId, message) {
    const result = await db.runAsync(
      `INSERT INTO study_group_messages (studyGroupId, userId, message, sentAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [studyGroupId, userId, message]
    );
    return await db.getAsync(
      `SELECT m.*, u.firstName, u.lastName, u.email, u.avatarUrl
       FROM study_group_messages m
       JOIN users u ON m.userId = u.id
       WHERE m.id = ?`,
      [result.lastID]
    );
  }
}

module.exports = StudyGroup;