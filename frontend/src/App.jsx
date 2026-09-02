import React, { useState, useEffect } from 'react';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('register');

  // Staff can reach Search/Admin only via a direct link:
  //   https://yoursite.com/#search
  //   https://yoursite.com/#admin
  // Regular customers who just visit the site never see these tabs.
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || hash === 'search') {
        setCurrentView(hash);
      } else {
        setCurrentView('register');
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const isStaffView = currentView === 'admin' || currentView === 'search';

  const goTo = (view) => {
    window.location.hash = view === 'register' ? '' : view;
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🚁 Drone Registration System</h1>

          {isStaffView && (
            <nav className="navbar">
              <button
                className={`nav-btn ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => goTo('register')}
              >
                Register
              </button>
              <button
                className={`nav-btn ${currentView === 'search' ? 'active' : ''}`}
                onClick={() => goTo('search')}
              >
                Search
              </button>
              <button
                className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => goTo('admin')}
              >
                Admin Dashboard
              </button>
            </nav>
          )}
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
  );
}

export default App;
