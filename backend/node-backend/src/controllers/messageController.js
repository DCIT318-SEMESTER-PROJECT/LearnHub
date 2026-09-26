const db = require('../config/database');

// ═══════════════════════════════════════════════════════
// GET /api/messages/conversations
// Returns one row per conversation partner, with last message + unread count
// ═══════════════════════════════════════════════════════
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Find everyone the user has exchanged messages with (either direction)
    const rows = await db.allAsync(
      `SELECT
         CASE
           WHEN senderId = ? THEN recipientId
           ELSE senderId
         END AS otherUserId,
         MAX(createdAt) AS lastAt
       FROM direct_messages
       WHERE senderId = ? OR recipientId = ?
       GROUP BY otherUserId
       ORDER BY lastAt DESC`,
      [userId, userId, userId]
    );

    const conversations = [];

    for (const row of rows) {
      const other = await db.getAsync(
        `SELECT id, firstName, lastName, avatarUrl, role, isInstructor
         FROM users WHERE id = ?`,
        [row.otherUserId]
      );
      if (!other) continue;

      const lastMsg = await db.getAsync(
        `SELECT id, body, attachmentType, attachmentName, senderId, createdAt
         FROM direct_messages
         WHERE (senderId = ? AND recipientId = ?)
            OR (senderId = ? AND recipientId = ?)
         ORDER BY createdAt DESC
         LIMIT 1`,
        [userId, other.id, other.id, userId]
      );

      const unread = await db.getAsync(
        `SELECT COUNT(*) as count FROM direct_messages
         WHERE senderId = ? AND recipientId = ? AND isRead = 0`,
        [other.id, userId]
      );

      conversations.push({
        user: other,
        lastMessage: lastMsg
          ? {
              body: lastMsg.body,
              hasAttachment: !!lastMsg.attachmentType,
              attachmentType: lastMsg.attachmentType,
              attachmentName: lastMsg.attachmentName,
              isOwn: lastMsg.senderId === userId,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount: unread?.count || 0,
      });
    }

    // Also include users the current user has started a thread with but not yet exchanged a message with? No — keep it simple.

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/messages/:userId
// Full message thread with a specific user. Marks their messages as read.
// ═══════════════════════════════════════════════════════
exports.getThread = async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: otherId } = req.params;

    if (parseInt(otherId) === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const other = await db.getAsync(
      `SELECT id, firstName, lastName, avatarUrl, role, isInstructor, bio
       FROM users WHERE id = ?`,
      [otherId]
    );
    if (!other) return res.status(404).json({ error: 'User not found' });

    const messages = await db.allAsync(
      `SELECT id, senderId, recipientId, body,
              attachmentData, attachmentType, attachmentName,
              isRead, createdAt
       FROM direct_messages
       WHERE (senderId = ? AND recipientId = ?)
          OR (senderId = ? AND recipientId = ?)
       ORDER BY createdAt ASC
       LIMIT 200`,
      [userId, otherId, otherId, userId]
    );

    // Mark their unread messages to me as read
    await db.runAsync(
      `UPDATE direct_messages
       SET isRead = 1
       WHERE senderId = ? AND recipientId = ? AND isRead = 0`,
      [otherId, userId]
    );

    res.json({ user: other, messages });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/messages/:userId
// Send a message to another user.
// ═══════════════════════════════════════════════════════
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: otherId } = req.params;
    const { body = '', attachment = null } = req.body;

    if (parseInt(otherId) === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    if (!body.trim() && !attachment) {
      return res.status(400).json({ error: 'Message or attachment is required' });
    }

    const recipient = await db.getAsync('SELECT id FROM users WHERE id = ?', [otherId]);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    let cleanAttachment = null;
    if (attachment) {
      const { data, type, name } = attachment;
      if (!data || !type || !name) {
        return res.status(400).json({ error: 'Attachment requires data, type and name' });
      }
      if (data.length > 2.7 * 1024 * 1024) {
        return res.status(400).json({ error: 'Attachment is too large (max 2MB)' });
      }
      cleanAttachment = { data, type, name };
    }

    const result = await db.runAsync(
      `INSERT INTO direct_messages
         (senderId, recipientId, body, attachmentData, attachmentType, attachmentName, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        otherId,
        body.trim(),
        cleanAttachment?.data || null,
        cleanAttachment?.type || null,
        cleanAttachment?.name || null,
      ]
    );

    const message = await db.getAsync(
      `SELECT id, senderId, recipientId, body,
              attachmentData, attachmentType, attachmentName,
              isRead, createdAt
       FROM direct_messages WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/messages/unread/count
// Total unread count — powers the navbar badge.
// ═══════════════════════════════════════════════════════
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const row = await db.getAsync(
      `SELECT COUNT(*) as count FROM direct_messages
       WHERE recipientId = ? AND isRead = 0`,
      [userId]
    );
    res.json({ count: row?.count || 0 });
  } catch (error) {
    console.error('Error counting unread:', error);
    res.status(500).json({ error: 'Failed to count unread' });
  }
};

// ═══════════════════════════════════════════════════════
// DELETE /api/messages/:userId
// Optional — clears the whole thread with a user (both directions).
// ═══════════════════════════════════════════════════════
exports.clearThread = async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: otherId } = req.params;

    await db.runAsync(
      `DELETE FROM direct_messages
       WHERE (senderId = ? AND recipientId = ?)
          OR (senderId = ? AND recipientId = ?)`,
      [userId, otherId, otherId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing thread:', error);
    res.status(500).json({ error: 'Failed to clear thread' });
  }
};