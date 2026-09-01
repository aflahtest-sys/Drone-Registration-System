import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('register');

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🚁 Drone Registration System</h1>
            <nav className="navbar">
              <button
                className={`nav-btn ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentView('register')}
              >
                Register
              </button>
              <button
                className={`nav-btn ${currentView === 'search' ? 'active' : ''}`}
                onClick={() => setCurrentView('search')}
              >
                Search
              </button>
              <button
                className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
              >
                Admin Dashboard
              </button>
            </nav>
          </div>
        </header>

        <main className="app-main">
          {currentView === 'register' && <RegisterPage />}
          {currentView === 'search' && <SearchResults />}
          {currentView === 'admin' && <AdminDashboard />}
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Drone Registration System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
