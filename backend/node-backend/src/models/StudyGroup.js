const db = require('../config/database');

class StudyGroup {
  static async findAll() {
    const groups = await db.allAsync('SELECT * FROM study_groups WHERE isActive = 1 ORDER BY createdAt DESC');
    
    for (let group of groups) {
      const members = await db.getAsync(
        'SELECT COUNT(*) as count FROM study_group_members WHERE studyGroupId = ?',
        [group.id]
      );
      group.members = members ? members.count : 0;
    }
    
    return groups;
  }

  static async findById(id) {
    return await db.getAsync('SELECT * FROM study_groups WHERE id = ? AND isActive = 1', [id]);
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
    if (memberCount.count >= group.maxMembers) {
      throw new Error('Group is full');
    }
    
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
      `SELECT u.id, u.firstName, u.lastName, u.email, sgm.isAdmin, sgm.joinedAt
       FROM study_group_members sgm
       JOIN users u ON sgm.userId = u.id
       WHERE sgm.studyGroupId = ?
       ORDER BY sgm.isAdmin DESC, sgm.joinedAt ASC`,
      [studyGroupId]
    );
  }

  static async getMessages(studyGroupId, limit = 50) {
    return await db.allAsync(
      `SELECT m.*, u.firstName, u.lastName, u.email
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
    
    const newMessage = await db.getAsync(
      `SELECT m.*, u.firstName, u.lastName, u.email
       FROM study_group_messages m
       JOIN users u ON m.userId = u.id
       WHERE m.id = ?`,
      [result.lastID]
    );
    
    return newMessage;
  }
}

module.exports = StudyGroup;