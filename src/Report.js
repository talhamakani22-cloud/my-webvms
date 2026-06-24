import { useEffect, useState } from 'react';
import './Report.css';

function Report({ onBackToDashboard, onRequireLogin }) {
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user && onRequireLogin) {
      onRequireLogin();
    }
  }, [onRequireLogin]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');


  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await fetch(`/api/visitors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVisitors(data.visitors);
      } else {
        setError(data.message || 'Failed to fetch visitors');
      }
    } catch (err) {
      setError('Failed to fetch visitors');
    }
    setLoading(false);
  };

  // Fetch all visitors on mount
  useEffect(() => {
    fetchVisitors();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Prevent search if all fields are empty
    if (!searchQuery.trim() && !startDate.trim() && !endDate.trim()) {
      setError('Please enter at least one filter value.');
      return;
    }
    setError('');
    fetchVisitors();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setError('');
    // Fetch all visitors after clearing filters
    fetchVisitors();
  };

  return (
    <div className="report-container">
      <div className="bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="report-header">
        <div className="report-title">
          <button className="back-btn" onClick={onBackToDashboard}>
            ←
          </button>
          <div>
            <h1>Emirates ID Report</h1>
            <p className="subtitle">View and filter Emirates ID records</p>
          </div>
        </div>
      </div>

      <div className="report-content">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-row">
            {/* Date Pickers */}
            <div className="date-picker-group">
              <label>From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-picker-group">
              <label>To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
            </div>

            {/* Search Box */}
            <div className="search-group">
              <label>Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Emirates ID, name, nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <button className="clear-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
            <button className="search-btn" onClick={handleSearch}>
              🔍 Search
            </button>
            <button className="refresh-btn" onClick={fetchVisitors}>
              🔄 Refresh
            </button>
          </div>

          <div className="results-count">
            {loading ? 'Loading...' : `Showing ${visitors.length} records`}
            {error && <span style={{ color: 'red', marginLeft: 10 }}>{error}</span>}
          </div>
        </div>

        {/* Visitors Table */}
        <div className="table-wrapper">
          <table className="visitors-report-table">
            <thead>
              <tr>
                <th>Emirates ID Number</th>
                <th>Full Name (English)</th>
                <th>Full Name (Arabic)</th>
                <th>Nationality</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Expiry Date</th>
                <th>Issue Date</th>
                <th>Purpose of Visit</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length > 0 ? (
                visitors.map((visitor, index) => (
                  <tr key={index}>
                    <td className="emirates-id-cell">{visitor.emiratesId}</td>
                    <td className="name-en-cell">{visitor.fullNameEnglish}</td>
                    <td className="name-ar-cell" dir="rtl">{visitor.fullNameArabic}</td>
                    <td>
                      <span className="nationality-badge">{visitor.nationality}</span>
                    </td>
                    <td>{visitor.dateOfBirth}</td>
                    <td>
                      <span className={`gender-badge ${visitor.gender?.toLowerCase()}`}>{visitor.gender}</span>
                    </td>
                    <td>{visitor.expiryDate}</td>
                    <td>{visitor.issueDate}</td>
                    <td>{visitor.purposeOfVisit || '-'}</td>
                    <td>{visitor.remark || visitor.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-results">
                    No records found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="report-actions">
        <button className="action-btn export-btn">
          📥 Export to CSV
        </button>
        <button className="action-btn print-btn">
          🖨️ Print Report
        </button>
        <button className="action-btn back-dashboard" onClick={onBackToDashboard}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Report;
