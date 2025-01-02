import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({
    name_cdn: '',
    ip_cdn: '',
    name_channel: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const navigate = useNavigate();

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...search
      });

      const response = await axios.get(`http://localhost:3000/monitoring/status?${params}`);
      setData(response.data.data);
      setPagination(response.data.pagination);
      setPageInput(page.toString());
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
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
      console.log('Auto-refreshing data...'); // Optional: for debugging
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [currentPage, search]); // Dependencies ensure interval is reset when these change

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
    if (value === '' || /^\d+$/.test(value)) {
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
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CDN Monitoring Dashboard</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by CDN Name"
            className="w-full p-2 border rounded-lg pl-8"
            value={search.name_cdn}
            onChange={(e) => setSearch(prev => ({ ...prev, name_cdn: e.target.value }))}
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by IP"
            className="w-full p-2 border rounded-lg pl-8"
            value={search.ip_cdn}
            onChange={(e) => setSearch(prev => ({ ...prev, ip_cdn: e.target.value }))}
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Channel Name"
            className="w-full p-2 border rounded-lg pl-8"
            value={search.name_channel}
            onChange={(e) => setSearch(prev => ({ ...prev, name_channel: e.target.value }))}
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CDN Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">No data found</td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.name_cdn}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.ip_cdn}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.name_channel}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">{item.response_time}ms</td> */}
                  <td className="px-6 py-4 whitespace-nowrap">{item.update_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetail(item.id)}
                      className="text-indigo-600 hover:text-indigo-900"
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

      {/* Enhanced Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
              <label htmlFor="pageInput" className="text-sm text-gray-600">Go to page:</label>
              <input
                id="pageInput"
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                className="w-16 p-1 border rounded-md text-center text-sm"
                placeholder="Page #"
              />
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Go
              </button>
            </form>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPreviousPage}
                className="p-2 border rounded-md disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 border rounded-md disabled:opacity-50"
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