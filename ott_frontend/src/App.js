import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import './App.css';

/**
 * Emoji details:
 */
/** =========================================================================
 * IMPORTANT: Fix mismatch between frontend emoji keys and backend expected values
 * Backend expects emoji key to be either "6", "out", "surprise", "laugh", "celebration"
 * (see ott_backend/src/api/endpoints.py: EMOJI_TYPES, and OpenAPI spec).
 * Frontend was sending "six" (not "6"), so adjust key for six to be "6".
 */
const EMOJI_OPTIONS = [
  {
    key: '6',
    label: '6️⃣',
    description: 'SIX'
  },
  {
    key: 'out',
    label: '🏏',
    description: 'OUT'
  },
  {
    key: 'surprise',
    label: '😲',
    description: 'Surprise'
  },
  {
    key: 'laugh',
    label: '😂',
    description: 'Laugh'
  },
  {
    key: 'celebration',
    label: '🎉',
    description: 'Celebration'
  }
];

const EMOJI_ANIMATION_DURATION = 1400; // ms

// PUBLIC_INTERFACE
function App() {
  // theme (defaults to dark for OTT use)
  const [theme, setTheme] = useState('dark');
  // match state
  const [match, setMatch] = useState(null);
  // latest emoji counts
  const [emojiCounts, setEmojiCounts] = useState({});
  // Currently animating emojis
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  // Error states
  const [error, setError] = useState('');

  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  // Setup on mount: fetch match details
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchMatchDetails();
  }, []);

  useEffect(() => {
    // Poll for emoji updates (simulate live update)
    let interval = null;
    if (match && match.match_id) {
      fetchEmojiReactions(match.match_id); // fetch immediately
      interval = setInterval(
        () => fetchEmojiReactions(match.match_id),
        3000
      );
    }
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line
  }, [match]);

  // Fetch match details
  const fetchMatchDetails = async () => {
    try {
      setError('');
      const res = await fetch('/api/match');
      if (!res.ok) throw new Error('Failed to fetch match details');
      const data = await res.json();
      setMatch(data);
    } catch (err) {
      setError('Could not load match details');
    }
  };

  // Fetch emoji reactions for a match
  const fetchEmojiReactions = async (matchId) => {
    try {
      const res = await fetch(`/api/emoji/${matchId}`);
      if (!res.ok) return;
      const data = await res.json();
      // Format: { reactions: [ {emoji: "six", count: 3 }, ... ] }
      const counts = {};
      if (data.reactions && Array.isArray(data.reactions)) {
        for (const rec of data.reactions) {
          counts[rec.emoji] = rec.count;
        }
      }
      setEmojiCounts(counts);
    } catch {
      // Ignore polling errors
    }
  };

  // Handler: send emoji to backend and animate
  const handleSendEmoji = async (emojiKey) => {
    if (!match) return;
    // Start animation
    animateEmoji(emojiKey);

    // Send to backend
    try {
      await fetch('/api/emoji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.match_id,
          emoji: emojiKey
        })
      });
      // Next poll will update reaction count
    } catch {
      // Ignore for now
    }
  };

  // Trigger emoji animation
  const animateEmoji = (emojiKey) => {
    // Pick a random horizontal offset (-40 to +40 px)
    const offsetX = Math.random() * 80 - 40;
    const id = `${emojiKey}-${Date.now()}-${Math.random()}`;
    setFlyingEmojis((emojis) => [...emojis, {
      id,
      emojiKey,
      offsetX
    }]);
    setTimeout(() => {
      setFlyingEmojis((emojis) => emojis.filter(e => e.id !== id));
    }, EMOJI_ANIMATION_DURATION + 100);
  };

  // UI helpers for formatting:
  const getTeamLogo = (team) =>
    team && team.logo_url ? (
      <img
        src={team.logo_url}
        className="team-logo"
        alt={`Logo of ${team.name}`}
        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(32,32,32,0.75)' }}
      />
    ) : (
      <span className="team-logo team-logo-placeholder">
        {team ? team.name[0].toUpperCase() : ''}
      </span>
    );

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Defensive (render nothing if data not ready)
  const loading = !match;

  return (
    <div className="App ott-root dark">
      <header className="ott-header">
        <h1 className="ott-title">OTT Match Viewer</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="ott-main">
        <div className="ott-player-area">
          {/* Video Player */}
          {!loading && (
            <div className="player-wrapper">
              <ReactPlayer
                ref={playerRef}
                className="react-player"
                url={match.youtube_url}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
                onReady={() => setPlayerReady(true)}
                light={false}
                style={{ borderRadius: '16px', overflow: 'hidden', background: '#000' }}
              />

              {/* Emoji Reaction Bar */}
              <div className="emoji-bar-row">
                <div className="emoji-bar">
                  {EMOJI_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className="emoji-btn"
                      title={opt.description}
                      onClick={() => handleSendEmoji(opt.key)}
                    >
                      <span className="emoji-symbol">{opt.label}</span>
                      <span className="emoji-count">
                        {emojiCounts[opt.key] || 0}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Flying emoji animations */}
                <div className="emoji-anim-layer">
                  {flyingEmojis.map(fly => {
                    const emoji = EMOJI_OPTIONS.find(e => e.key === fly.emojiKey);
                    return (
                      <span
                        key={fly.id}
                        className="emoji-flying"
                        style={{
                          left: `calc(50% + ${fly.offsetX}px)`,
                          animationDuration: `${EMOJI_ANIMATION_DURATION}ms`
                        }}
                      >
                        {emoji ? emoji.label : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {(!loading && error) && (
            <div className="ott-error">{error}</div>
          )}
          {loading && (
            <div className="ott-loading">
              <div className="loading-spinner"></div>
              <span>Loading match video…</span>
            </div>
          )}
        </div>
        {/* Match details below player */}
        {!loading && (
          <section className="ott-info-section">
            <div className="score-row">
              <div className="team-score-block">
                {getTeamLogo(match.team_a)}
                <div className="team-name">{match.team_a.name}</div>
                <div className="team-score">
                  {match.score && match.score.team_a
                    ? match.score.team_a : '-'}
                </div>
              </div>
              <div className="vs">
                <div>vs</div>
                <div className={`badge badge-${match.status}`}>
                  {match.status && match.status.toUpperCase()}
                </div>
              </div>
              <div className="team-score-block">
                {getTeamLogo(match.team_b)}
                <div className="team-name">{match.team_b.name}</div>
                <div className="team-score">
                  {match.score && match.score.team_b
                    ? match.score.team_b : '-'}
                </div>
              </div>
            </div>
            <div className="match-meta-row">
              <span className="match-date">
                <span role="img" aria-label="clock">🕒</span>{' '}
                {new Date(match.start_time).toLocaleString()}
              </span>
              <span className="match-id">Match ID: {match.match_id}</span>
            </div>
            <div className="players-row">
              <div>
                <strong>{match.team_a.name} XI:</strong>
                {' '}
                <span className="player-list">
                  {match.team_a.players.slice(0, 5).join(', ') + (match.team_a.players.length > 5 ? ', ...' : '')}
                </span>
              </div>
              <div>
                <strong>{match.team_b.name} XI:</strong>
                {' '}
                <span className="player-list">
                  {match.team_b.players.slice(0, 5).join(', ') + (match.team_b.players.length > 5 ? ', ...' : '')}
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="ott-footer">
        <span>
          <strong>Powered by OTT Match Streaming</strong>
        </span>
      </footer>
    </div>
  );
}

export default App;
