import React, { useEffect, useState } from 'react';
import { getRecentActivity } from '../../api/publicAPI';

const FALLBACK_EVENTS = [
  { icon: '🎓', text: 'Aisha enrolled in React Advanced Patterns', time: '2m ago' },
  { icon: '⭐', text: 'Kwame rated Data Science Fundamentals 5 stars', time: '5m ago' },
  { icon: '🚀', text: 'Dr. Emily published Python for Data Analysis', time: '12m ago' },
  { icon: '👋', text: 'Kofi joined LearnHub', time: '20m ago' },
  { icon: '🎓', text: 'Sarah enrolled in CSS Mastery', time: '1h ago' },
];

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

function LiveActivityTicker() {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch events once on mount
  useEffect(() => {
    let cancelled = false;

    const fetchActivity = async () => {
      try {
        const { data } = await getRecentActivity();
        if (cancelled) return;

        const list = (data?.events || [])
          .filter((e) => e.text)
          .map((e, i) => ({
            id: i,
            icon: e.icon,
            text: e.text,
            time: timeAgo(e.at),
          }));

        if (list.length < 4) {
          const merged = [
            ...list,
            ...FALLBACK_EVENTS.map((f, i) => ({ ...f, id: `f-${i}` })),
          ];
          setEvents(merged);
        } else {
          setEvents(list);
        }
      } catch (err) {
        console.warn('Live activity fetch failed:', err.message);
        setEvents(FALLBACK_EVENTS.map((f, i) => ({ ...f, id: `f-${i}` })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cycle: fade in → hold 3.5s → fade out → advance → fade in next
  useEffect(() => {
    if (events.length === 0) return;

    // Show current one
    setVisible(true);

    const holdTimer = setTimeout(() => {
      setVisible(false);
    }, 3500);

    const advanceTimer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % events.length);
    }, 4000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(advanceTimer);
    };
  }, [currentIndex, events.length]);

  if (loading || events.length === 0) return null;

  const current = events[currentIndex];
  if (!current) return null;

  return (
    <div className="pop-activity-wrap" aria-live="polite">
      <div
        className={`pop-activity-card ${visible ? 'is-visible' : ''}`}
        key={currentIndex}
      >
        <div className="pop-activity-icon">{current.icon || '🎓'}</div>
        <div className="pop-activity-body">
          <span className="pop-activity-text">{current.text}</span>
          {current.time && (
            <span className="pop-activity-time">{current.time}</span>
          )}
        </div>
        <div className="pop-activity-pulse" aria-hidden="true" />
      </div>
    </div>
  );
}

export default LiveActivityTicker;