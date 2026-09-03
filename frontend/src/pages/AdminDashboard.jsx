import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';

const STATUS_COLORS = {
  completed: { bg: '#dcfce7', text: '#166534' },
  verified: { bg: '#dbeafe', text: '#1e40af' },
  pending: { bg: '#fef9c3', text: '#854d0e' }
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, recordsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecords(currentPage, 20, statusFilter === 'all' ? null : statusFilter)
      ]);

      setStats(statsRes.data.stats);
      setRecords(recordsRes.data.records || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      await adminAPI.updateStatus(recordId, newStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await adminAPI.deleteRecord(recordId);
        fetchData();
      } catch (err) {
        alert('Failed to delete record');
      }
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await adminAPI.exportJSON();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)]));
      link.download = `drone-registrations-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (err) {
      alert('Failed to export data');
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const statusStyle = (status) => STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#334155' };

  return (
    <div className="admin-dashboard">
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>Admin Dashboard</h2>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
              {stats.totalRegistrations}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Total Registrations
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
              {stats.completedRegistrations || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Completed
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ea580c' }}>
              {stats.pendingRegistrations || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Pending
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
              {stats.verifiedRegistrations || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Verified
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#64748b' }}>
              {stats.recentRegistrations || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Last 7 Days
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Records Management</h3>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <label style={{ marginRight: '10px', fontWeight: '500' }}>Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <button className="btn btn-success" onClick={handleExportJSON}>
            📥 Export as JSON
          </button>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Drone Model</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const s = statusStyle(record.status);
                  return (
                    <tr key={record._id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>{record.customerName}</td>
                      <td style={{ padding: '12px' }}>{record.phoneNumber}</td>
                      <td style={{ padding: '12px' }}>{record.droneModel}</td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(record._id, e.target.value)}
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            cursor: 'pointer',
                            backgroundColor: s.bg,
                            color: s.text
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="verified">Verified</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleViewDetails(record)}
                          style={{ marginRight: '5px' }}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(record._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No records found</p>
        )}
      </div>

      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowModal(false)}>×</span>

            <h3 style={{ marginBottom: '20px' }}>Record Details</h3>

            <div style={{ marginBottom: '20px' }}>
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {selectedRecord.customerName}</p>
              <p><strong>ID Number:</strong> {selectedRecord.idNumber}</p>
              <p><strong>Email:</strong> {selectedRecord.email}</p>
              <p><strong>Phone:</strong> {selectedRecord.phoneNumber}</p>
              <p><strong>ID Expiry:</strong> {new Date(selectedRecord.idExpiryDate).toLocaleDateString()}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Drone Information</h4>
              <p><strong>Model:</strong> {selectedRecord.droneModel}</p>
              <p><strong>Serial Number:</strong> {selectedRecord.droneSerialNumber}</p>
            </div>

            {selectedRecord.idPhotoBase64 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>ID Card Photo</h4>
                <img
                  src={`data:image/jpeg;base64,${selectedRecord.idPhotoBase64}`}
                  alt="ID Card"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </div>
            )}

            {selectedRecord.dronePhotoBase64 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Drone Box Photo</h4>
                <img
                  src={`data:image/jpeg;base64,${selectedRecord.dronePhotoBase64}`}
                  alt="Drone Box"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
