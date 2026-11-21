import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Movie form state
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [runtime, setRuntime] = useState('');
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);
  const [watched, setWatched] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Inline prerequisite editor state
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [editPrereqTitles, setEditPrereqTitles] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const loadMovies = async () => {
    try {
      setError(null);
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      setError(err.message || 'Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const handlePrereqToggle = (movieTitle) => {
    setSelectedPrereqs((prev) =>
      prev.includes(movieTitle)
        ? prev.filter((t) => t !== movieTitle)
        : [...prev, movieTitle]
    );
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    setFormError(null);

    const yearNum = parseInt(releaseYear, 10);
    const runtimeNum = parseInt(runtime, 10);

    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (isNaN(yearNum) || yearNum < 1888 || yearNum > 2100) {
      setFormError('Release year must be between 1888 and 2100.');
      return;
    }
    if (isNaN(runtimeNum) || runtimeNum < 1 || runtimeNum > 300) {
      setFormError('Runtime must be between 1 and 300 minutes.');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.createMovie({
        title: title.trim(),
        release_year: yearNum,
        runtime: runtimeNum,
        prerequisites: selectedPrereqs,
        watched: watched,
      });

      // Reset form
      setTitle('');
      setReleaseYear('');
      setRuntime('');
      setSelectedPrereqs([]);
      setWatched(false);

      await loadMovies();
    } catch (err) {
      setFormError(err.message || 'Failed to add movie.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleWatched = async (movie) => {
    try {
      setError(null);
      await api.patchMovie(movie.id, {
        watched: !movie.watched,
        release_year: movie.release_year,
        prerequisites: (movie.prerequisites || []).map((p) =>
          typeof p === 'string' ? p : p.title
        ),
      });
      await loadMovies();
    } catch (err) {
      setError(err.message || 'Failed to update watched status.');
    }
  };

  const startEditPrerequisites = (movie) => {
    setEditingMovieId(movie.id);
    setEditPrereqTitles(
      (movie.prerequisites || []).map((p) => (typeof p === 'string' ? p : p.title))
    );
    setEditError(null);
  };

  const handleEditPrereqToggle = (movieTitle) => {
    setEditPrereqTitles((prev) =>
      prev.includes(movieTitle)
        ? prev.filter((t) => t !== movieTitle)
        : [...prev, movieTitle]
    );
  };

  const handleSavePrerequisites = async (movieId) => {
    setEditSubmitting(true);
    setEditError(null);
    try {
      const movie = movies.find((m) => m.id === movieId);
      await api.patchMovie(movieId, {
        release_year: movie ? movie.release_year : undefined,
        prerequisites: editPrereqTitles,
      });
      setEditingMovieId(null);
      await loadMovies();
    } catch (err) {
      if (err.code === 'CIRCULAR_DEPENDENCY') {
        setEditError(
          "That would make a loop: a movie can't depend on itself, even through other movies."
        );
      } else {
        setEditError(err.message || 'Failed to update prerequisites.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelPrerequisites = () => {
    setEditingMovieId(null);
    setEditError(null);
  };

  return (
    <div>
      <section className="section">
        <h2>Add a movie</h2>
        {formError && <p className="error-text">{formError}</p>}
        <form onSubmit={handleAddMovie}>
          <div className="form-group">
            <label className="form-label" htmlFor="movie-title">Title</label>
            <input
              id="movie-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Iron Man"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="movie-year">Release year</label>
            <input
              id="movie-year"
              type="number"
              min="1888"
              max="2100"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="e.g. 2008"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="movie-runtime">Runtime (minutes)</label>
            <input
              id="movie-runtime"
              type="number"
              min="1"
              max="300"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              placeholder="e.g. 126"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prerequisites</label>
            {movies.length === 0 ? (
              <p className="muted-text">No existing movies to pick as prerequisites.</p>
            ) : (
              <div className="checklist-box">
                {movies.map((m) => (
                  <div key={m.id} className="checklist-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedPrereqs.includes(m.title)}
                        onChange={() => handlePrereqToggle(m.title)}
                      />
                      {m.title} ({m.release_year})
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={watched}
                onChange={(e) => setWatched(e.target.checked)}
              />
              Watched
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Adding...' : 'Add movie'}
          </button>
        </form>
      </section>

      <section className="section">
        <h2>All movies</h2>
        {loading && <p className="muted-text">Loading...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && movies.length === 0 && (
          <p className="empty-state">No movies yet.</p>
        )}

        {!loading && movies.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Runtime</th>
                  <th>Prerequisites</th>
                  <th>Watched</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => {
                  const isEditing = editingMovieId === m.id;
                  const prereqTitles = (m.prerequisites || [])
                    .map((p) => (typeof p === 'string' ? p : p.title))
                    .join(', ');

                  return (
                    <React.Fragment key={m.id}>
                      <tr>
                        <td><strong>{m.title}</strong></td>
                        <td>{m.release_year}</td>
                        <td>{m.runtime} min</td>
                        <td>{prereqTitles || '—'}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={m.watched}
                            onChange={() => handleToggleWatched(m)}
                            aria-label={`Watched ${m.title}`}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-small"
                            onClick={() =>
                              isEditing
                                ? handleCancelPrerequisites()
                                : startEditPrerequisites(m)
                            }
                          >
                            {isEditing ? 'Close' : 'Edit prerequisites'}
                          </button>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr>
                          <td colSpan="6">
                            <div className="inline-editor">
                              <p className="muted-text" style={{ marginBottom: '8px' }}>
                                Prerequisites for <em>{m.title}</em>:
                              </p>
                              <div className="checklist-box" style={{ maxWidth: '100%' }}>
                                {movies
                                  .filter((other) => other.id !== m.id)
                                  .map((other) => (
                                    <div key={other.id} className="checklist-item">
                                      <label className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={editPrereqTitles.includes(other.title)}
                                          onChange={() =>
                                            handleEditPrereqToggle(other.title)
                                          }
                                        />
                                        {other.title} ({other.release_year})
                                      </label>
                                    </div>
                                  ))}
                              </div>
                              {editError && (
                                <p className="error-text">{editError}</p>
                              )}
                              <div className="button-group">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-small"
                                  disabled={editSubmitting}
                                  onClick={() => handleSavePrerequisites(m.id)}
                                >
                                  {editSubmitting ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-small"
                                  onClick={handleCancelPrerequisites}
                                  disabled={editSubmitting}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
