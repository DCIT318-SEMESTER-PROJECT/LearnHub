// ═══════════════════════════════════════════════════════
// DIRECT CHAT — find or create a private 2-person group
// ═══════════════════════════════════════════════════════
exports.getOrCreateDirectChat = async (req, res) => {
  try {
    const userId = req.userId;
    const otherId = parseInt(req.params.userId);

    if (!otherId || otherId === userId) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    const other = await db.getAsync(
      'SELECT id, firstName, lastName FROM users WHERE id = ?',
      [otherId]
    );
    if (!other) return res.status(404).json({ error: 'User not found' });

    // Look for an existing 2-person group containing exactly these two users
    const existing = await db.getAsync(
      `SELECT sg.id
       FROM study_groups sg
       WHERE sg.isActive = 1
         AND (SELECT COUNT(*) FROM study_group_members WHERE studyGroupId = sg.id) = 2
         AND EXISTS (SELECT 1 FROM study_group_members WHERE studyGroupId = sg.id AND userId = ?)
         AND EXISTS (SELECT 1 FROM study_group_members WHERE studyGroupId = sg.id AND userId = ?)
       LIMIT 1`,
      [userId, otherId]
    );

    if (existing) {
      const group = await StudyGroup.findById(existing.id);
      return res.json({ group, created: false });
    }

    // Create a new private chat group
    const me = await db.getAsync(
      'SELECT id, firstName, lastName FROM users WHERE id = ?',
      [userId]
    );
    const name = `💬 ${me.firstName} & ${other.firstName}`;
    const description = 'Private conversation';

    const groupId = await StudyGroup.create({
      name,
      description,
      courseId: null,
      createdBy: userId,
      maxMembers: 2,
      meetingSchedule: '',
    });

    await StudyGroup.joinGroup(groupId, userId);
    await StudyGroup.joinGroup(groupId, otherId);

    await db.runAsync(
      'UPDATE study_group_members SET isAdmin = 1 WHERE studyGroupId = ? AND userId = ?',
      [groupId, userId]
    );

    const group = await StudyGroup.findById(groupId);
    res.status(201).json({ group, created: true });
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ error: 'Failed to open chat: ' + error.message });
  }
};