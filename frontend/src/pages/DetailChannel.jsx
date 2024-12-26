import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DetailChannel = () => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/monitoring/status/detail/${id}`);
        setDetail(response.data.data);
      } catch (error) {
        console.error('Error fetching detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Channel Monitoring Details</h2>
        </div>

        {detail && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CDN Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{detail.name_cdn}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">IP Address</h3>
                  <p className="mt-1 text-sm text-gray-900">{detail.ip_cdn}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Channel Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{detail.name_channel}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    detail.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {detail.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
                  <p className="mt-1 text-sm text-gray-900">{detail.response_time}ms</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">{detail.update_at}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Request URL</h3>
                  <p className="mt-1 text-sm text-gray-900 break-all">{detail.request_url}</p>
                </div>
              </div>
            </div>

            {detail.error_message && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Error Message</h3>
                <div className="mt-1 p-3 bg-red-50 text-red-700 rounded-md">
                  {detail.error_message}
                </div>
              </div>
            )}

            {detail.response_body && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Response Body</h3>
                <div className="mt-1 p-3 bg-gray-50 rounded-md overflow-x-auto">
                  <pre className="text-sm text-gray-900">{detail.response_body}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailChannel;