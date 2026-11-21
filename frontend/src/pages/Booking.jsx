import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Booking() {
  const [cinemas, setCinemas] = useState([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [cinemasError, setCinemasError] = useState(null);

  // Quote form state
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // Add Cinema form state
  const [cinemaName, setCinemaName] = useState('');
  const [bundleSizesInput, setBundleSizesInput] = useState('');
  const [addCinemaLoading, setAddCinemaLoading] = useState(false);
  const [addCinemaError, setAddCinemaError] = useState(null);
  const [addCinemaSuccess, setAddCinemaSuccess] = useState(null);

  const loadCinemas = async () => {
    try {
      setCinemasError(null);
      const data = await api.getCinemas();
      setCinemas(data);
      if (data.length > 0 && !selectedCinemaId) {
        setSelectedCinemaId(String(data[0].id));
      }
    } catch (err) {
      setCinemasError(err.message || 'Failed to load cinemas.');
    } finally {
      setLoadingCinemas(false);
    }
  };

  useEffect(() => {
    loadCinemas();
  }, []);

  const selectedCinema = cinemas.find((c) => String(c.id) === String(selectedCinemaId));

  const handleGetQuote = async (e) => {
    e.preventDefault();
    setQuoteError(null);
    setQuoteResult(null);

    const sizeNum = parseInt(groupSize, 10);
    if (!selectedCinemaId) {
      setQuoteError('Please select a cinema.');
      return;
    }
    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 10000) {
      setQuoteError('Group size must be between 1 and 10,000.');
      return;
    }

    setQuoteLoading(true);
    try {
      const data = await api.getBookingQuote(selectedCinemaId, sizeNum);
      setQuoteResult(data);
    } catch (err) {
      setQuoteError(err.message || 'Failed to get quote.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleAddCinema = async (e) => {
    e.preventDefault();
    setAddCinemaError(null);
    setAddCinemaSuccess(null);

    if (!cinemaName.trim()) {
      setAddCinemaError('Cinema name is required.');
      return;
    }

    const rawParts = bundleSizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawParts.length === 0) {
      setAddCinemaError('Please provide at least one bundle size.');
      return;
    }

    if (rawParts.length > 10) {
      setAddCinemaError('You can specify at most 10 bundle sizes.');
      return;
    }

    const parsedSizes = [];
    for (const part of rawParts) {
      const num = Number(part);
      if (!Number.isInteger(num) || num < 1 || num > 500) {
        setAddCinemaError('Each bundle size must be an integer between 1 and 500.');
        return;
      }
      parsedSizes.push(num);
    }

    const uniqueSizes = new Set(parsedSizes);
    if (uniqueSizes.size !== parsedSizes.length) {
      setAddCinemaError('Bundle sizes must be different from each other.');
      return;
    }

    setAddCinemaLoading(true);
    try {
      const newCinema = await api.createCinema({
        name: cinemaName.trim(),
        bundle_sizes: parsedSizes,
      });

      setCinemaName('');
      setBundleSizesInput('');
      setAddCinemaSuccess(`Added ${newCinema.name}.`);
      await loadCinemas();
      setSelectedCinemaId(String(newCinema.id));
    } catch (err) {
      setAddCinemaError(err.message || 'Failed to add cinema.');
    } finally {
      setAddCinemaLoading(false);
    }
  };

  return (
    <div>
      <section className="section">
        <h2>Opening Night Seat Bundles</h2>
        <p className="muted-text">
          Find the minimum ticket bundles needed for your group.
        </p>

        {loadingCinemas && <p className="muted-text">Loading cinemas...</p>}
        {cinemasError && <p className="error-text">{cinemasError}</p>}

        {!loadingCinemas && cinemas.length === 0 && (
          <p className="empty-state">No cinemas listed yet. Add one below.</p>
        )}

        {!loadingCinemas && cinemas.length > 0 && (
          <form onSubmit={handleGetQuote}>
            <div className="form-group">
              <label className="form-label" htmlFor="cinema-select">
                Cinema
              </label>
              <select
                id="cinema-select"
                value={selectedCinemaId}
                onChange={(e) => {
                  setSelectedCinemaId(e.target.value);
                  setQuoteResult(null);
                  setQuoteError(null);
                }}
              >
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedCinema && (
                <p className="muted-text" style={{ marginTop: '5px' }}>
                  Sold in bundles of {selectedCinema.bundle_sizes.join(', ')}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="group-size-input">
                Seats needed
              </label>
              <input
                id="group-size-input"
                type="number"
                min="1"
                max="10000"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                placeholder="e.g. 11"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={quoteLoading}
            >
              {quoteLoading ? 'Getting quote...' : 'Get quote'}
            </button>
          </form>
        )}

        {quoteError && <p className="error-text">{quoteError}</p>}

        {quoteResult && (
          <div className="quote-result">
            {quoteResult.possible ? (
              <>
                <p>
                  <strong>
                    Buy {quoteResult.total_bundles} bundle
                    {quoteResult.total_bundles === 1 ? '' : 's'}
                  </strong>
                </p>
                <ul className="quote-bundles-list">
                  {quoteResult.bundles.map((b) => (
                    <li key={b.size}>
                      {b.size} seats &times; {b.count}
                    </li>
                  ))}
                </ul>
                <p className="muted-text">
                  Total seats: {quoteResult.group_size}
                </p>
              </>
            ) : (
              <p className="error-text" style={{ margin: 0 }}>
                Not possible with this cinema's bundle sizes. Seats are sold
                only in whole bundles, so some group sizes can't be matched
                exactly.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="section">
        <details>
          <summary>Add a cinema</summary>
          <form onSubmit={handleAddCinema} style={{ marginTop: '12px' }}>
            {addCinemaError && <p className="error-text">{addCinemaError}</p>}
            {addCinemaSuccess && (
              <p style={{ color: 'var(--watched-color)', marginBottom: '10px' }}>
                {addCinemaSuccess}
              </p>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="new-cinema-name">
                Cinema name
              </label>
              <input
                id="new-cinema-name"
                type="text"
                value={cinemaName}
                onChange={(e) => setCinemaName(e.target.value)}
                placeholder="e.g. Star Cineplex"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-bundle-sizes">
                Bundle sizes (comma-separated, 1-500)
              </label>
              <input
                id="new-bundle-sizes"
                type="text"
                value={bundleSizesInput}
                onChange={(e) => setBundleSizesInput(e.target.value)}
                placeholder="e.g. 2, 5"
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={addCinemaLoading}
            >
              {addCinemaLoading ? 'Adding...' : 'Add cinema'}
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
