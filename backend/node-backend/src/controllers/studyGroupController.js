const StudyGroup = require('../models/StudyGroup');
const db = require('../config/database');

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.findAll();
    
    // Check if user is a member of each group
    if (req.userId) {
      for (let group of groups) {
        group.isJoined = await StudyGroup.isMember(group.id, req.userId);
        
        // Check if user is admin
        const isAdmin = await db.getAsync(
          'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
          [group.id, req.userId]
        );
        group.isAdmin = isAdmin ? !!isAdmin.isAdmin : false;
      }
    }
    
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
    
    if (!group) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    const members = await StudyGroup.getMembers(groupId);
    const messages = await StudyGroup.getMessages(groupId);
    const isMember = req.userId ? await StudyGroup.isMember(groupId, req.userId) : false;
    
    // Check if user is admin
    let isAdmin = false;
    if (req.userId) {
      const adminCheck = await db.getAsync(
        'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
        [groupId, req.userId]
      );
      isAdmin = adminCheck ? !!adminCheck.isAdmin : false;
    }

    res.json({
      ...group,
      members,
      messages,
      isMember,
      isAdmin,
      memberCount: members.length
    });
  } catch (error) {
    console.error('Error fetching study group:', error);
    res.status(500).json({ error: 'Failed to fetch study group' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, courseId, maxMembers, meetingSchedule } = req.body;
    const userId = req.userId;

    console.log('📝 Creating study group:', { name, description, courseId, userId });

    if (!name || !description || !courseId) {
      return res.status(400).json({ error: 'Name, description and courseId are required' });
    }

    // Create the group
    const groupId = await StudyGroup.create({
      name,
      description,
      courseId: parseInt(courseId),
      createdBy: userId,
      maxMembers: maxMembers || 20,
      meetingSchedule: meetingSchedule || ''
    });

    console.log('✅ Group created with ID:', groupId);

    // Add creator as admin
    await StudyGroup.joinGroup(groupId, userId);
    await db.runAsync(
      'UPDATE study_group_members SET isAdmin = 1 WHERE studyGroupId = ? AND userId = ?',
      [groupId, userId]
    );

    // Get the created group
    const group = await StudyGroup.findById(groupId);
    
    // Get member count
    const memberCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_group_members WHERE studyGroupId = ?',
      [groupId]
    );
    
    const response = {
      ...group,
      members: memberCount ? memberCount.count : 1,
      isJoined: true,
      isAdmin: true
    };

    console.log('📤 Sending response:', response);
    
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error creating study group:', error);
    res.status(500).json({ error: 'Failed to create study group: ' + error.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Check if group exists
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    const result = await StudyGroup.joinGroup(groupId, userId);
    if (!result) {
      return res.status(400).json({ error: 'Already a member' });
    }

    res.json({ success: true, message: 'Joined study group' });
  } catch (error) {
    console.error('Error joining study group:', error);
    if (error.message === 'Group is full') {
      return res.status(400).json({ error: 'Group is full' });
    }
    res.status(500).json({ error: 'Failed to join study group' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Check if group exists
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    await StudyGroup.leaveGroup(groupId, userId);
    res.json({ success: true, message: 'Left study group' });
  } catch (error) {
    console.error('Error leaving study group:', error);
    if (error.message === 'Cannot leave as the only admin. Transfer admin role first.') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to leave study group' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Check if group exists
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    // Check if user is admin
    const isAdmin = await db.getAsync(
      'SELECT isAdmin FROM study_group_members WHERE studyGroupId = ? AND userId = ?',
      [groupId, userId]
    );
    
    if (!isAdmin || !isAdmin.isAdmin) {
      return res.status(403).json({ error: 'Only group admins can delete this group' });
    }

    // Delete all messages first
    await db.runAsync('DELETE FROM study_group_messages WHERE studyGroupId = ?', [groupId]);
    // Delete all members
    await db.runAsync('DELETE FROM study_group_members WHERE studyGroupId = ?', [groupId]);
    // Delete the group
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
    
    // Check if user is a member of the group
    if (req.userId) {
      const isMember = await StudyGroup.isMember(groupId, req.userId);
      if (!isMember) {
        return res.status(403).json({ error: 'You must be a member to view messages' });
      }
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

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if user is a member of the group
    const isMember = await StudyGroup.isMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a member to send messages' });
    }

    const newMessage = await StudyGroup.addMessage(groupId, userId, message.trim());
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};