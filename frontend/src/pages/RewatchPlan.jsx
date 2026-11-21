import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ProgressBar from '../components/ProgressBar';

export default function RewatchPlan() {
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setError(null);
        const data = await api.getMovies();
        setMovies(data);
      } catch (err) {
        setError(err.message || 'Failed to load movies.');
      } finally {
        setLoadingMovies(false);
      }
    }
    fetchMovies();
  }, []);

  const loadPlan = async (movieId) => {
    if (!movieId) {
      setPlan(null);
      return;
    }
    setLoadingPlan(true);
    setError(null);
    try {
      const data = await api.getRewatchOrder(movieId);
      setPlan(data);
    } catch (err) {
      setError(err.message || 'Failed to load rewatch plan.');
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSelectMovie = (e) => {
    const id = e.target.value;
    setSelectedMovieId(id);
    loadPlan(id);
  };

  const handleToggleWatched = async (item) => {
    try {
      setError(null);
      await api.patchMovie(item.id, {
        watched: !item.watched,
        release_year: item.release_year,
        prerequisites: [],
      });
      if (selectedMovieId) {
        await loadPlan(selectedMovieId);
      }
    } catch (err) {
      setError(err.message || 'Failed to update watched status.');
    }
  };

  const formatRemainingTime = (minutes) => {
    if (!minutes || minutes <= 0) {
      return '0m';
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    }
    if (h > 0 && m === 0) {
      return `${h}h`;
    }
    return `${m}m`;
  };

  return (
    <div>
      <section className="section">
        <h2>Rewatch Plan</h2>
        <p className="muted-text">
          Select a target movie to see what you need to watch before it.
        </p>

        {loadingMovies ? (
          <p className="muted-text">Loading...</p>
        ) : (
          <div className="form-group">
            <label className="form-label" htmlFor="target-movie-select">
              Target movie
            </label>
            <select
              id="target-movie-select"
              value={selectedMovieId}
              onChange={handleSelectMovie}
            >
              <option value="">Select a movie...</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.release_year})
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
      </section>

      {loadingPlan && <p className="muted-text">Loading...</p>}

      {!loadingPlan && plan && (
        <section className="section">
          <h2>Prerequisites for {plan.target}</h2>

          {plan.total_count === 0 ? (
            <p className="empty-state">
              Nothing to watch first. You can start this one right away.
            </p>
          ) : (
            <>
              <p>
                {plan.watched_count} of {plan.total_count} watched
              </p>

              <ProgressBar value={plan.watched_count} max={plan.total_count} />

              <p className="muted-text">
                Remaining watch time: {formatRemainingTime(plan.unwatched_runtime)}
              </p>

              {plan.total_count > 0 && plan.watched_count === plan.total_count && (
                <p style={{ color: 'var(--watched-color)', fontWeight: 600, margin: '12px 0' }}>
                  You're caught up.
                </p>
              )}

              <ol className="rewatch-list">
                {plan.order.map((item, index) => (
                  <li
                    key={item.id}
                    className={`rewatch-item ${item.watched ? 'watched' : ''}`}
                  >
                    <span className="rewatch-item-index">{index + 1}.</span>
                    <label className="checkbox-label rewatch-item-content">
                      <input
                        type="checkbox"
                        checked={item.watched}
                        onChange={() => handleToggleWatched(item)}
                        aria-label={`Mark ${item.title} as ${item.watched ? 'unwatched' : 'watched'}`}
                      />
                      <span>
                        {item.title} ({item.release_year}) &mdash; {item.runtime} min
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}
