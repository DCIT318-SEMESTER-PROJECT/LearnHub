import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getStudyGroups, 
  joinStudyGroup, 
  leaveStudyGroup, 
  createStudyGroup,
  deleteStudyGroup,
  getGroupMessages,
  sendGroupMessage
} from '../api/studyGroupsAPI';
import { getCourses } from '../api/coursesAPI';
import { useAuth } from '../context/AuthContext';

function StudyGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    maxMembers: 20,
    meetingSchedule: ''
  });
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, coursesRes] = await Promise.all([
        getStudyGroups(),
        getCourses()
      ]);
      setGroups(groupsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      setLoadingMessages(true);
      const response = await getGroupMessages(groupId);
      // Messages come as [{ id, userId, message, sentAt, firstName, lastName }]
      const messages = response.data.map(msg => ({
        id: msg.id,
        userId: msg.userId,
        user: `${msg.firstName || 'User'} ${msg.lastName || ''}`.trim(),
        message: msg.message,
        time: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.userId === user?.id
      }));
      setChatMessages(messages.reverse()); // Show oldest first
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!formData.name || !formData.description || !formData.courseId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        courseId: parseInt(formData.courseId),
        maxMembers: parseInt(formData.maxMembers) || 20,
        meetingSchedule: formData.meetingSchedule || ''
      };
      
      const response = await createStudyGroup(payload);
      
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        courseId: '',
        maxMembers: 20,
        meetingSchedule: ''
      });
      
      // Add new group to list
      if (response.data) {
        setGroups(prev => [response.data, ...prev]);
      }
      
      alert('✅ Study group created successfully! 🎉');
      
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Failed to create study group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this study group? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteStudyGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setChatMessages([]);
      }
      alert('✅ Study group deleted successfully!');
    } catch (err) {
      console.error('Error deleting group:', err);
      alert(err.response?.data?.error || 'Failed to delete study group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await joinStudyGroup(groupId, user.id);
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, members: (group.members || 0) + 1, isJoined: true }
          : group
      ));
    } catch (err) {
      console.error('Error joining group:', err);
      alert(err.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await leaveStudyGroup(groupId, user.id);
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, members: (group.members || 0) - 1, isJoined: false }
          : group
      ));
    } catch (err) {
      console.error('Error leaving group:', err);
      alert(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedGroup || !user) return;

    try {
      // Optimistically add message
      const tempMessage = {
        id: Date.now(),
        userId: user.id,
        user: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
        message: chatMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        isTemp: true
      };
      setChatMessages(prev => [...prev, tempMessage]);
      setChatMessage('');

      // Send to server
      await sendGroupMessage(selectedGroup.id, chatMessage.trim());
      
      // Fetch updated messages to get the real one with server timestamp
      await fetchMessages(selectedGroup.id);
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
      // Remove the optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== Date.now()));
    }
  };

  const openChat = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    setSelectedGroup(group);
    setChatMessages([]);
    await fetchMessages(groupId);
  };

  const closeChat = () => {
    setSelectedGroup(null);
    setChatMessages([]);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const getCourseIcon = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.imageUrl || '📚' : '📚';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
        <p>Loading study groups...</p>
      </div>
    );
  }

  return (
    <div className="study-groups-page" style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
      {/* Header */}
      <div className="header-section" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: '#1a1a2e' }}>Study Groups</h2>
          <p style={{ color: '#666' }}>{groups.length} groups available</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          + Create New Group
        </button>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div style={{
          padding: '2rem',
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #eeecfb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>Create a Study Group</h3>
          <form onSubmit={handleCreateGroup}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Group Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., React Study Squad"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1a1a2e',
                    background: '#ffffff'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Course *</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: '#ffffff',
                    color: '#1a1a2e',
                    cursor: 'pointer'
                  }}
                  required
                >
                  <option value="" style={{ color: '#1a1a2e', background: '#ffffff' }}>Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id} style={{ color: '#1a1a2e', background: '#ffffff' }}>
                      {course.imageUrl || '📚'} {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this study group will focus on..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    color: '#1a1a2e',
                    background: '#ffffff',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Max Members</label>
                <input
                  type="number"
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleInputChange}
                  min="2"
                  max="50"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1a1a2e',
                    background: '#ffffff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Meeting Schedule</label>
                <input
                  type="text"
                  name="meetingSchedule"
                  value={formData.meetingSchedule}
                  onChange={handleInputChange}
                  placeholder="e.g., Tuesdays 7 PM EST"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1a1a2e',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '0.75rem 2rem',
                  background: creating ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.7 : 1
                }}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

   {/* Groups Grid - Responsive */}
{groups.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '4rem' }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
    <h3>No study groups yet</h3>
    <p style={{ color: '#666' }}>Be the first to create a study group for your course!</p>
    <button
      onClick={() => setShowCreateForm(true)}
      style={{
        marginTop: '1rem',
        padding: '0.75rem 2rem',
        background: '#6c5ce7',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}
    >
      Create One Now
    </button>
  </div>
) : (
  <div className="group-grid" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
    gap: '1.5rem',
    width: '100%'
  }}>
    {groups.map(group => (
      <div key={group.id} className="group-card" style={{
        padding: 'clamp(1rem, 2vw, 1.5rem)',
        background: '#ffffff',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,92,231,0.15)';
        e.currentTarget.style.borderColor = '#6c5ce7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{getCourseIcon(group.courseId)}</span>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <h3 className="group-name" style={{ 
              fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
              color: '#1a1a2e',
              fontWeight: '600'
            }}>
              {group.name}
            </h3>
            <Link to={`/courses/${group.courseId}`} style={{ 
              fontSize: 'clamp(0.7rem, 1vw, 0.8rem)', 
              color: '#6c5ce7',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              {getCourseName(group.courseId)}
            </Link>
          </div>
        </div>
        
        <p className="group-desc" style={{ 
          color: '#4b5563', 
          fontSize: 'clamp(0.85rem, 1vw, 0.9rem)', 
          marginBottom: '0.75rem',
          lineHeight: '1.5',
          flex: '1'
        }}>
          {group.description}
        </p>

        {group.meetingSchedule && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
            color: '#6c5ce7',
            background: '#f0eeff',
            padding: '0.25rem 0.75rem',
            borderRadius: '6px',
            width: 'fit-content',
            maxWidth: '100%'
          }}>
            <span>📅</span>
            <span style={{ wordBreak: 'break-word' }}>{group.meetingSchedule}</span>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <span style={{ color: '#6b7280', fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }}>
              👥 {group.members || 0}/{group.maxMembers || 20} members
            </span>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Recently'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {group.isJoined ? (
              <>
                <button
                  onClick={() => openChat(group.id)}
                  style={{
                    padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 1.5vw, 1rem)',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#5a4bd1'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#6c5ce7'}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => handleLeaveGroup(group.id)}
                  style={{
                    padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.75rem, 1.5vw, 1rem)',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  Leave
                </button>
              </>
            ) : (
              <button
                onClick={() => handleJoinGroup(group.id)}
                style={{
                  padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(1rem, 2vw, 1.5rem)',
                  background: '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#5a4bd1'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6c5ce7'}
              >
                Join Group
              </button>
            )}
            {group.isAdmin && (
              <button
                onClick={() => handleDeleteGroup(group.id)}
                style={{
                  padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
                title="Delete Group"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
)}
      {/* Chat Modal */}
      {selectedGroup && (
        <div className="chat-modal" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '420px',
          maxHeight: '550px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #eeecfb',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Chat Header */}
          <div className="chat-header" style={{
            padding: '1rem 1.5rem',
            background: '#6c5ce7',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: '600' }}>{selectedGroup.name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {selectedGroup.members || 0} members • {getCourseName(selectedGroup.courseId)}
              </div>
            </div>
            <button
              onClick={closeChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages" style={{
            padding: '1rem',
            flex: 1,
            overflowY: 'auto',
            maxHeight: '300px',
            minHeight: '200px',
            background: '#f9fafb'
          }}>
            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading messages...
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: msg.isOwn ? '#6c5ce7' : '#1a1a2e'
                    }}>
                      {msg.user || 'Unknown User'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#999' }}>
                      {msg.time}
                    </span>
                  </div>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: msg.isOwn ? '#6c5ce7' : '#f0f0f0',
                    color: msg.isOwn ? 'white' : '#1a1a2e',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    wordWrap: 'break-word'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input" style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid #eeecfb',
            display: 'flex',
            gap: '0.5rem',
            background: '#ffffff',
            borderRadius: '0 0 12px 12px'
          }}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#1a1a2e',
                background: '#ffffff'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e);
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyGroups;