const StudyGroup = require('../models/StudyGroup');
const db = require('../config/database');

// Attach per-user flags to a list of groups
async function decorateGroups(groups, userId) {
  if (!userId) return groups;
  for (const g of groups) {
    g.isJoined = await StudyGroup.isMember(g.id, userId);
    const admin = await db.getAsync(
      'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [g.id, userId]
    );
    g.isAdmin = admin ? !!admin.isAdmin : false;
  }
  return groups;
}

exports.getAllGroups = async (req, res) => {
  try {
    const { filter, courseId } = req.query;
    let groups;

    if (courseId) {
      groups = await StudyGroup.findByCourse(parseInt(courseId));
    } else if (filter === 'mine' && req.userId) {
      groups = await StudyGroup.findMyGroups(req.userId);
    } else if (filter === 'created' && req.userId) {
      const all = await StudyGroup.findAll();
      groups = all.filter((g) => g.createdBy === req.userId);
    } else {
      groups = await StudyGroup.findAll();
    }

    await decorateGroups(groups, req.userId);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching study groups:', error);
    res.status(500).json({ error: 'Failed to fetch study groups' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Study group not found' });

    const members = await StudyGroup.getMembers(groupId);
    const messages = await StudyGroup.getMessages(groupId);
    const isMember = req.userId ? await StudyGroup.isMember(groupId, req.userId) : false;

    let isAdmin = false;
    if (req.userId) {
      const adminCheck = await db.getAsync(
        'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
        [groupId, req.userId]
      );
      isAdmin = adminCheck ? !!adminCheck.isAdmin : false;
    }

    res.json({ ...group, members, messages, isMember, isAdmin, memberCount: members.length });
  } catch (error) {
    console.error('Error fetching study group:', error);
    res.status(500).json({ error: 'Failed to fetch study group' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, courseId, maxMembers, meetingSchedule } = req.body;
    const userId = req.userId;

    if (!name || !description || !courseId) {
      return res.status(400).json({ error: 'Name, description and course are required' });
    }

    const groupId = await StudyGroup.create({
      name,
      description,
      courseId: parseInt(courseId),
      createdBy: userId,
      maxMembers: parseInt(maxMembers) || 20,
      meetingSchedule: meetingSchedule || '',
    });

    await StudyGroup.joinGroup(groupId, userId);
    await db.runAsync(
      'UPDATE study_group_members SET isAdmin = 1 WHERE studyGroupId = ? AND userId = ?',
      [groupId, userId]
    );

    const group = await StudyGroup.findById(groupId);
    group.isJoined = true;
    group.isAdmin = true;
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating study group:', error);
    res.status(500).json({ error: 'Failed to create study group: ' + error.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Study group not found' });

    const result = await StudyGroup.joinGroup(groupId, userId);
    if (!result) return res.status(400).json({ error: 'Already a member' });
    res.json({ success: true, message: 'Joined study group' });
  } catch (error) {
    if (error.message === 'Group is full') {
      return res.status(400).json({ error: 'Group is full' });
    }
    console.error('Error joining study group:', error);
    res.status(500).json({ error: 'Failed to join study group' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Study group not found' });

    await StudyGroup.leaveGroup(groupId, userId);
    res.json({ success: true, message: 'Left study group' });
  } catch (error) {
    if (error.message.startsWith('Cannot leave')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error leaving study group:', error);
    res.status(500).json({ error: 'Failed to leave study group' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Study group not found' });

    const isAdmin = await db.getAsync(
      'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [groupId, userId]
    );
    if (!isAdmin || !isAdmin.isAdmin) {
      return res.status(403).json({ error: 'Only group admins can delete this group' });
    }

    await db.runAsync('DELETE FROM study_group_messages WHERE studyGroupId = ?', [groupId]);
    await db.runAsync('DELETE FROM study_group_members WHERE studyGroupId = ?', [groupId]);
    await db.runAsync('DELETE FROM study_groups WHERE id = ?', [groupId]);

    res.json({ success: true, message: 'Study group deleted successfully' });
  } catch (error) {
    console.error('Error deleting study group:', error);
    res.status(500).json({ error: 'Failed to delete study group' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50 } = req.query;
    if (req.userId) {
      const isMember = await StudyGroup.isMember(groupId, req.userId);
      if (!isMember) return res.status(403).json({ error: 'You must be a member to view messages' });
    }
    const messages = await StudyGroup.getMessages(groupId, parseInt(limit));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    const userId = req.userId;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const isMember = await StudyGroup.isMember(groupId, userId);
    if (!isMember) return res.status(403).json({ error: 'You must be a member to send messages' });

    const newMessage = await StudyGroup.addMessage(groupId, userId, message.trim());
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};