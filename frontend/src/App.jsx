import React from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Movies from './pages/Movies';
import RewatchPlan from './pages/RewatchPlan';
import Booking from './pages/Booking';

export default function App() {
  return (
    <div className="site-container">
      <header className="site-header">
        <Link to="/" className="site-title">
          Doomsday Ready
        </Link>
        <nav className="site-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Movies
          </NavLink>
          <NavLink
            to="/plan"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Rewatch Plan
          </NavLink>
          <NavLink
            to="/booking"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Booking
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/plan" element={<RewatchPlan />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="*" element={<Movies />} />
        </Routes>
      </main>
    </div>
  );
}
