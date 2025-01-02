import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({
    name_cdn: "",
    ip_cdn: "",
    name_channel: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...search,
      });

      const response = await axios.get(`/api/monitoring/status?${params}`);
      setData(response.data.data);
      setPagination(response.data.pagination);
      setPageInput(page.toString());
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect for initial load and search/page changes
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, search]);

  // Effect for auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(currentPage);
      console.log("Auto-refreshing data...", new Date().toLocaleTimeString());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []); // Dependencies ensure interval is reset when these change

  // Format the last refresh time
  const formatLastRefresh = () => {
    return lastRefresh.toLocaleTimeString();
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(1);
  };

  const handleViewDetail = (id) => {
    navigate(`/detail/${id}`);
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput);
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setCurrentPage(pageNumber);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="container">
      <h1 className="title">CDN Monitoring Dashboard</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by CDN Name"
            className="search-input"
            value={search.name_cdn}
            onChange={(e) =>
              setSearch((prev) => ({ ...prev, name_cdn: e.target.value }))
            }
          />
          <Search className="search-icon" />
        </div>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by IP"
            className="search-input"
            value={search.ip_cdn}
            onChange={(e) =>
              setSearch((prev) => ({ ...prev, ip_cdn: e.target.value }))
            }
          />
          <Search className="search-icon" />
        </div>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by Channel Name"
            className="search-input"
            value={search.name_channel}
            onChange={(e) =>
              setSearch((prev) => ({ ...prev, name_channel: e.target.value }))
            }
          />
          <Search className="search-icon" />
        </div>
      </form>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th>CDN Name</th>
              <th>IP</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="table-cell"
                  style={{ textAlign: "center" }}
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="table-cell"
                  style={{ textAlign: "center" }}
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="table-cell">{item.name_cdn}</td>
                  <td className="table-cell">{item.ip_cdn}</td>
                  <td className="table-cell">{item.name_channel}</td>
                  <td className="table-cell">
                    <span
                      className={`status-badge ${
                        item.status ? "status-active" : "status-inactive"
                      }`}
                    >
                      {item.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell">{item.update_at}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleViewDetail(item.id)}
                      className="view-details-button"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="pagination-container">
          <div>
            <p className="pagination-text">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </p>
          </div>
          <div className="pagination-controls">
            <form onSubmit={handlePageInputSubmit} className="page-form">
              <label htmlFor="pageInput" className="pagination-text">
                Go to page:
              </label>
              <input
                id="pageInput"
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                className="page-input"
                placeholder="Page #"
              />
              <button type="submit" className="page-submit">
                Go
              </button>
            </form>
            <div className="pagination-buttons">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPreviousPage}
                className="pagination-button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="pagination-button"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
