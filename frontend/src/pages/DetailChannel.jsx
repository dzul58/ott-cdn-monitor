import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// import '../index.css';
import '../styles.css';

const DetailChannel = () => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://172.17.42.175:3000/monitoring/status/detail/${id}`);
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
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <button
        onClick={() => navigate(-1)}
        className="back-button"
      >
        <ArrowLeft className="back-icon" />
        Back to Dashboard
      </button>

      <div className="detail-card">
        <div className="card-header">
          <h2 className="card-title">Channel Monitoring Details</h2>
        </div>

        {detail && (
          <div className="card-content">
            <div className="detail-grid">
              <div className="detail-section">
                <div className="detail-item">
                  <h3 className="detail-label">CDN Name</h3>
                  <p className="detail-value">{detail.name_cdn}</p>
                </div>
                <div className="detail-item">
                  <h3 className="detail-label">IP Address</h3>
                  <p className="detail-value">{detail.ip_cdn}</p>
                </div>
                <div className="detail-item">
                  <h3 className="detail-label">Channel Name</h3>
                  <p className="detail-value">{detail.name_channel}</p>
                </div>
                <div className="detail-item">
                  <h3 className="detail-label">Status</h3>
                  <span className={`status-badge ${detail.status ? 'status-active' : 'status-inactive'}`}>
                    {detail.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-item">
                  <h3 className="detail-label">Response Time</h3>
                  <p className="detail-value">{detail.response_time}ms</p>
                </div>
                <div className="detail-item">
                  <h3 className="detail-label">Last Updated</h3>
                  <p className="detail-value">{detail.update_at}</p>
                </div>
                <div className="detail-item">
                  <h3 className="detail-label">Request URL</h3>
                  <p className="detail-value break-all">{detail.request_url}</p>
                </div>
              </div>
            </div>

            {detail.error_message && (
              <div className="error-message">
                <h3 className="detail-label">Error Message</h3>
                <div className="error-content">
                  {detail.error_message}
                </div>
              </div>
            )}

            {detail.response_body && (
              <div className="response-body">
                <h3 className="detail-label">Response Body</h3>
                <div className="response-content">
                  <pre className="response-pre">{detail.response_body}</pre>
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