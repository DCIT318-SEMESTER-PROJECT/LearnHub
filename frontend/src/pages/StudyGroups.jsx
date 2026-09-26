import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
  createStudyGroup,
  deleteStudyGroup,
  getGroupMessages,
  sendGroupMessage,
  getMemberPreviews,
} from '../api/studyGroupsAPI';
import { getCourses } from '../api/coursesAPI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MemberProfileModal from '../components/common/MemberProfileModal';
import GroupDetailModal from '../components/studyGroups/GroupDetailModal';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function StudyGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [groups, setGroups] = useState([]);
  const [memberPreviews, setMemberPreviews] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachInputRef = useRef(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [detailGroupId, setDetailGroupId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    maxMembers: 20,
    meetingSchedule: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Auto-open chat from ?open=<groupId>
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || groups.length === 0) return;

    const target = groups.find((g) => g.id === parseInt(openId));
    if (target) {
      setDetailGroupId(null);
      setProfileUserId(null);
      setSelectedGroup(target);
      setChatMessages([]);
      setPendingAttachment(null);
      fetchMessages(target.id);

      // Clean URL
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  }, [groups, searchParams]);

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
        getCourses(),
      ]);
      const fetchedGroups = groupsRes.data || [];
      setGroups(fetchedGroups);
      setCourses(coursesRes.data || []);

      if (fetchedGroups.length > 0) {
        try {
          const ids = fetchedGroups.map((g) => g.id);
          const previewRes = await getMemberPreviews(ids);
          setMemberPreviews(previewRes.data || {});
        } catch (err) {
          console.warn('Member previews unavailable:', err.message);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      setLoadingMessages(true);
      const res = await getGroupMessages(groupId);
      const messages = (res.data || []).map((m) => ({
        id: m.id,
        userId: m.userId,
        user: `${m.firstName || 'User'} ${m.lastName || ''}`.trim(),
        avatarUrl: m.avatarUrl,
        message: m.message,
        attachmentData: m.attachmentData,
        attachmentType: m.attachmentType,
        attachmentName: m.attachmentName,
        time: new Date(m.sentAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isOwn: m.userId === user?.id,
      }));
      setChatMessages(messages.reverse());
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!formData.name || !formData.description || !formData.courseId) {
      toast.error('Please fill in name, description and course');
      return;
    }
    try {
      setCreating(true);
      const res = await createStudyGroup({
        name: formData.name,
        description: formData.description,
        courseId: parseInt(formData.courseId),
        maxMembers: parseInt(formData.maxMembers) || 20,
        meetingSchedule: formData.meetingSchedule || '',
      });
      setGroups((prev) => [res.data, ...prev]);
      setFormData({ name: '', description: '', courseId: '', maxMembers: 20, meetingSchedule: '' });
      setShowCreate(false);
      toast.success('Study group created! 🎉');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const performDelete = async () => {
    const groupId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteStudyGroup(groupId);
      setGroups((g) => g.filter((x) => x.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setChatMessages([]);
      }
      if (detailGroupId === groupId) setDetailGroupId(null);
      toast.success('Group deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleJoin = async (groupId) => {
    if (!user) return navigate('/login');
    try {
      await joinStudyGroup(groupId);
      setGroups((gs) =>
        gs.map((g) =>
          g.id === groupId
            ? { ...g, members: (g.members || 0) + 1, isJoined: true }
            : g
        )
      );
      toast.success('Joined group');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeave = async (groupId) => {
    try {
      await leaveStudyGroup(groupId);
      setGroups((gs) =>
        gs.map((g) =>
          g.id === groupId
            ? { ...g, members: Math.max(0, (g.members || 0) - 1), isJoined: false }
            : g
        )
      );
      toast.info('Left group');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  // ✅ openChat now always closes other modals first, and works from anywhere
  const openChat = async (group) => {
    setDetailGroupId(null);
    setProfileUserId(null);
    setSelectedGroup(group);
    setChatMessages([]);
    setPendingAttachment(null);
    await fetchMessages(group.id);
  };

  const closeChat = () => {
    setSelectedGroup(null);
    setChatMessages([]);
    setChatMessage('');
    setPendingAttachment(null);
  };

  const handleAttachmentPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be less than 2MB');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/', 'application/pdf', 'text/plain', 'text/markdown'];
    const isAllowed = allowedTypes.some((prefix) =>
      prefix.endsWith('/') ? file.type.startsWith(prefix) : file.type === prefix
    );

    if (!isAllowed) {
      toast.error('Only images, PDFs, and text files are supported');
      e.target.value = '';
      return;
    }

    setUploadingAttachment(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingAttachment({
        data: reader.result,
        type: file.type,
        name: file.name,
        size: file.size,
      });
      setUploadingAttachment(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploadingAttachment(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!chatMessage.trim() && !pendingAttachment) || !selectedGroup) return;

    const text = chatMessage.trim();
    const attachment = pendingAttachment;

    const temp = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      user: `${user.firstName || 'You'} ${user.lastName || ''}`.trim(),
      message: text,
      attachmentData: attachment?.data,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      isTemp: true,
    };
    setChatMessages((prev) => [...prev, temp]);
    setChatMessage('');
    setPendingAttachment(null);

    try {
      await sendGroupMessage(selectedGroup.id, text, attachment);
      await fetchMessages(selectedGroup.id);
    } catch (err) {
      setChatMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setChatMessage(text);
      setPendingAttachment(attachment);
      toast.error(err.response?.data?.error || 'Failed to send message');
    }
  };

  const filteredGroups = useMemo(() => {
    let list = [...groups];
    if (filter === 'mine') list = list.filter((g) => g.isJoined);
    if (filter === 'created') list = list.filter((g) => g.isAdmin);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.courseTitle?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [groups, filter, search]);

  const tabCounts = useMemo(() => ({
    all: groups.length,
    mine: groups.filter((g) => g.isJoined).length,
    created: groups.filter((g) => g.isAdmin).length,
  }), [groups]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading study groups...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 clamp(1rem, 3vw, 2rem)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2rem)', color: 'var(--text-primary)' }}>
            👥 Study Groups
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Join a group, meet peers, and learn together
          </p>
        </div>
        <button
          onClick={() => (user ? setShowCreate((v) => !v) : navigate('/login'))}
          style={{
            padding: '0.7rem 1.4rem',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(108,92,231,0.3)',
          }}
        >
          {showCreate ? '✕ Close' : '+ Create Group'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: 'clamp(1.25rem, 3vw, 1.75rem)',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
            Create a Study Group
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <Label>Group Name *</Label>
              <Input name="name" value={formData.name} onChange={handleInput} placeholder="e.g. React Study Squad" />
            </div>
            <div>
              <Label>Course *</Label>
              <select name="courseId" value={formData.courseId} onChange={handleInput} required style={selectStyle}>
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Description *</Label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInput}
                required
                rows={3}
                placeholder="What will this group focus on?"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <Label>Max Members</Label>
              <input type="number" name="maxMembers" value={formData.maxMembers} onChange={handleInput} min={2} max={50} style={inputStyle} />
            </div>
            <div>
              <Label>Meeting Schedule</Label>
              <input name="meetingSchedule" value={formData.meetingSchedule} onChange={handleInput} placeholder="e.g. Tuesdays 7 PM" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '0.65rem 1.5rem',
                background: creating ? '#a29bfe' : '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {creating ? 'Creating…' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              style={{
                padding: '0.65rem 1.5rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'mine', label: 'My Groups' },
            { id: 'created', label: 'Created by Me' },
          ].map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? '#6c5ce7' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t.label} ({tabCounts[t.id]})
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search groups or courses…"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.65rem 0.9rem',
            background: 'var(--bg-input, var(--bg-secondary))',
            border: '1px solid var(--border-input, var(--border-primary))',
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Groups grid */}
      {filteredGroups.length === 0 ? (
        <EmptyState filter={filter} hasGroups={groups.length > 0} onCreate={() => setShowCreate(true)} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              members={memberPreviews[group.id] || []}
              onJoin={() => handleJoin(group.id)}
              onLeave={() => handleLeave(group.id)}
              onOpen={() => openChat(group)}
              onDelete={() => setConfirmDeleteId(group.id)}
              onViewProfile={(uid) => setProfileUserId(uid)}
              onOpenDetail={() => setDetailGroupId(group.id)}
            />
          ))}
        </div>
      )}

      {/* Group Detail Modal */}
      <GroupDetailModal
        groupId={detailGroupId}
        onClose={() => setDetailGroupId(null)}
        onViewMember={(uid) => setProfileUserId(uid)}
        onChat={(group) => openChat(group)}
        onJoin={(id) => handleJoin(id)}
        onLeave={(id) => handleLeave(id)}
        onDelete={(id) => setConfirmDeleteId(id)}
      />

      {/* Chat panel — zIndex 1700 so it always sits on top */}
      {selectedGroup && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: 'min(420px, calc(100vw - 40px))',
            maxHeight: 'min(600px, calc(100vh - 40px))',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-primary)',
            zIndex: 1700,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedGroup.name}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedGroup.members || 0} members · {selectedGroup.courseTitle || 'Private'}
              </div>
            </div>
            <button
              onClick={closeChat}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              minHeight: '200px',
              maxHeight: '380px',
            }}
          >
            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                Loading messages…
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, var(--text-tertiary))', fontSize: '0.9rem' }}>
                No messages yet — say hi! 👋
              </div>
            ) : (
              chatMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.isOwn ? 'flex-end' : 'flex-start',
                    marginBottom: '0.65rem',
                    opacity: m.isTemp ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <button
                      onClick={() => !m.isOwn && setProfileUserId(m.userId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: m.isOwn ? 'default' : 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: m.isOwn ? '#6c5ce7' : 'var(--text-primary)',
                        fontFamily: 'inherit',
                      }}
                    >
                      {m.isOwn ? 'You' : m.user}
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{m.time}</span>
                  </div>

                  <div
                    style={{
                      padding: m.attachmentData ? '0.45rem' : '0.5rem 0.8rem',
                      background: m.isOwn ? '#6c5ce7' : 'var(--bg-card)',
                      color: m.isOwn ? 'white' : 'var(--text-primary)',
                      borderRadius: '12px',
                      maxWidth: '82%',
                      wordBreak: 'break-word',
                      fontSize: '0.9rem',
                      border: m.isOwn ? 'none' : '1px solid var(--border-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {m.attachmentData && m.attachmentType?.startsWith('image/') && (
                      <img
                        src={m.attachmentData}
                        alt={m.attachmentName || 'image'}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '220px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}

                    {m.attachmentData && !m.attachmentType?.startsWith('image/') && (
                      <a
                        href={m.attachmentData}
                        download={m.attachmentName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.7rem',
                          background: m.isOwn ? 'rgba(255,255,255,0.18)' : 'var(--bg-secondary)',
                          border: m.isOwn ? '1px solid rgba(255,255,255,0.28)' : '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>
                          {m.attachmentType === 'application/pdf' ? '📄' : '📝'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '180px',
                          }}
                        >
                          {m.attachmentName || 'Download'}
                        </span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.75, marginLeft: 'auto' }}>↓</span>
                      </a>
                    )}

                    {m.message && (
                      <div style={{ padding: m.attachmentData ? '0 0.35rem 0.1rem' : 0 }}>
                        {m.message}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--border-primary)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {pendingAttachment && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.7rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                }}
              >
                {pendingAttachment.type.startsWith('image/') ? (
                  <img src={pendingAttachment.data} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.3rem' }}>
                    {pendingAttachment.type === 'application/pdf' ? '📄' : '📝'}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pendingAttachment.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {formatBytes(pendingAttachment.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '1rem', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => attachInputRef.current?.click()}
                disabled={uploadingAttachment}
                title="Attach file"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-input, var(--border-primary))',
                  cursor: uploadingAttachment ? 'wait' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--text-secondary)',
                }}
              >
                {uploadingAttachment ? '⏳' : '📎'}
              </button>
              <input
                ref={attachInputRef}
                type="file"
                accept="image/*,application/pdf,text/plain,text/markdown"
                onChange={handleAttachmentPick}
                style={{ display: 'none' }}
              />

              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={pendingAttachment ? 'Add a caption…' : 'Type a message…'}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border-input, var(--border-primary))',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-input, var(--bg-secondary))',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={(!chatMessage.trim() && !pendingAttachment) || uploadingAttachment}
                style={{
                  padding: '0.55rem 1rem',
                  background:
                    (!chatMessage.trim() && !pendingAttachment) || uploadingAttachment
                      ? '#a29bfe'
                      : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor:
                    (!chatMessage.trim() && !pendingAttachment) || uploadingAttachment
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity:
                    (!chatMessage.trim() && !pendingAttachment) || uploadingAttachment ? 0.7 : 1,
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete this study group?"
        message="All messages and memberships will be removed. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={performDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {profileUserId && (
        <MemberProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  );
}

/* ─── GroupCard ──────────────────────────────────────── */
function GroupCard({ group, members = [], onJoin, onLeave, onOpen, onDelete, onViewProfile, onOpenDetail }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${hover ? '#6c5ce7' : 'var(--border-primary)'}`,
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hover ? '0 12px 32px rgba(108,92,231,0.15)' : 'var(--shadow-sm)',
        height: '100%',
        cursor: 'pointer',
      }}
    >
      {group.courseId && (
        <Link
          to={`/courses/${group.courseId}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.7rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            textDecoration: 'none',
            marginBottom: '0.85rem',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {isImageUrl(group.courseImageUrl) ? (
            <img src={group.courseImageUrl} alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.85rem' }}>📚</span>
          )}
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px',
            }}
          >
            {group.courseTitle || 'Course'}
          </span>
        </Link>
      )}

      <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
        {group.name}
      </h3>

      <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>
        {group.description}
      </p>

      {members.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.75rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex' }}>
            {members.slice(0, 4).map((m, i) => (
              <button
                key={m.id}
                onClick={(e) => { e.stopPropagation(); onViewProfile(m.id); }}
                title={`${m.firstName} ${m.lastName}${m.isAdmin ? ' · Admin' : ''}`}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  border: '2px solid var(--bg-secondary)',
                  marginLeft: i === 0 ? 0 : '-10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {isImageUrl(m.avatarUrl) ? (
                  <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials(m.firstName, m.lastName)
                )}
              </button>
            ))}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '0.78rem',
              color: '#6c5ce7',
              fontWeight: 600,
              fontFamily: 'inherit',
              textDecoration: 'underline',
            }}
          >
            {group.members || members.length}
            {group.members > members.length ? ` · +${group.members - members.length} more` : ' members'}
          </button>

          {group.isAdmin && (
            <span style={{ fontSize: '0.62rem', color: '#6c5ce7', background: '#f0eeff', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700, marginLeft: 'auto' }}>
              ADMIN
            </span>
          )}
        </div>
      )}

      {group.meetingSchedule && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            color: '#6c5ce7',
            background: '#f0eeff',
            padding: '0.3rem 0.7rem',
            borderRadius: '8px',
            marginBottom: '0.75rem',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          📅 <span style={{ wordBreak: 'break-word' }}>{group.meetingSchedule}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-primary)',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {group.members || 0}/{group.maxMembers || 20} spots
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {group.isJoined ? (
            <>
              <button onClick={onOpen} style={btnPrimary}>💬 Chat</button>
              <button onClick={onLeave} style={btnGhost}>Leave</button>
            </>
          ) : (
            <button onClick={onJoin} style={btnPrimary}>Join Group</button>
          )}
          {group.isAdmin && (
            <button onClick={onDelete} style={btnDanger} title="Delete group">🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────── */
function EmptyState({ filter, hasGroups, onCreate }) {
  const message =
    !hasGroups
      ? { icon: '👥', title: 'No study groups yet', sub: 'Be the first to create one!' }
      : filter === 'mine'
      ? { icon: '🔍', title: "You haven't joined any groups", sub: 'Browse the All tab and join one.' }
      : filter === 'created'
      ? { icon: '🛠️', title: "You haven't created any groups", sub: 'Start a group for a course you love.' }
      : { icon: '🔍', title: 'No matches', sub: 'Try a different search term.' };

  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '18px',
        border: '2px dashed var(--border-primary)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{message.icon}</div>
      <h3 style={{ margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>{message.title}</h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{message.sub}</p>
      {(filter === 'all' || filter === 'created') && (
        <button
          onClick={onCreate}
          style={{
            padding: '0.65rem 1.5rem',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          + Create Group
        </button>
      )}
    </div>
  );
}

/* ─── style helpers ─────────────────────────────────── */
const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  background: 'var(--bg-input, var(--bg-secondary))',
  border: '1px solid var(--border-input, var(--border-primary))',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

const btnPrimary = {
  padding: '0.45rem 0.9rem',
  background: '#6c5ce7',
  color: 'white',
  border: 'none',
  borderRadius: '9px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const btnGhost = {
  padding: '0.45rem 0.9rem',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '9px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  whiteSpace: 'nowrap',
};

const btnDanger = {
  padding: '0.45rem 0.65rem',
  background: 'transparent',
  color: '#ef4444',
  border: '1px solid #fecaca',
  borderRadius: '9px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

function Label({ children }) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: '0.35rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </label>
  );
}

function Input({ style, ...props }) {
  return <input {...props} style={{ ...inputStyle, ...style }} />;
}

export default StudyGroups;