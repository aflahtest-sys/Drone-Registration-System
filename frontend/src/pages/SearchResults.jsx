import React, { useState, useEffect } from 'react';
import { searchAPI } from '../utils/api';

function SearchResults() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setCurrentPage(1);

    try {
      const response = await searchAPI.search(searchQuery, searchType, 1, 10);
      setResults(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / 10));
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setLoading(true);

    try {
      const response = await searchAPI.search(searchQuery, searchType, nextPage, 10);
      setResults(prev => [...prev, ...(response.data.data || [])]);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load more results');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleDownloadPDF = async (recordId) => {
    try {
      const response = await registerAPI.getById(recordId);
      // Create a blob from the PDF (if it's stored in the database)
      const link = document.createElement('a');
      link.href = `${process.env.REACT_APP_API_URL}/register/${recordId}/pdf`;
      link.download = `registration-${recordId}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="search-page">
      <div className="card">
        <h2 className="card-title">Search Registrations</h2>

        <form onSubmit={handleSearch}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Search Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="name">Customer Name</option>
                <option value="phone">Phone Number</option>
                <option value="droneModel">Drone Model</option>
                <option value="serialNumber">Serial Number</option>
              </select>
            </div>

            <div className="form-group">
              <label>Search Query</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search term..."
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h3 className="card-title">Results ({results.length})</h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Drone Model</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Serial Number</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(record => (
                  <tr key={record._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{record.customerName}</td>
                    <td style={{ padding: '12px' }}>{record.phoneNumber}</td>
                    <td style={{ padding: '12px' }}>{record.droneModel}</td>
                    <td style={{ padding: '12px' }}>{record.droneSerialNumber}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: record.status === 'approved' ? '#dcfce7' : '#fee2e2',
                        color: record.status === 'approved' ? '#166534' : '#7f1d1d',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleViewDetails(record)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentPage < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowModal(false)}>×</span>

            <h3 style={{ marginBottom: '20px' }}>Registration Details</h3>

            <div style={{ marginBottom: '20px' }}>
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {selectedRecord.customerName}</p>
              <p><strong>ID:</strong> {selectedRecord.customerId}</p>
              <p><strong>Phone:</strong> {selectedRecord.phoneNumber}</p>
              <p><strong>ID Expiry:</strong> {new Date(selectedRecord.idExpiryDate).toLocaleDateString()}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Drone Information</h4>
              <p><strong>Model:</strong> {selectedRecord.droneModel}</p>
              <p><strong>Serial Number:</strong> {selectedRecord.droneSerialNumber}</p>
            </div>

            {selectedRecord.idPhoto && (
              <div style={{ marginBottom: '20px' }}>
                <h4>ID Card Photo</h4>
                <img
                  src={selectedRecord.idPhoto}
                  alt="ID Card"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </div>
            )}

            {selectedRecord.droneBoxPhoto && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Drone Box Photo</h4>
                <img
                  src={selectedRecord.droneBoxPhoto}
                  alt="Drone Box"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={() => handleDownloadPDF(selectedRecord._id)}
            >
              Download PDF Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
