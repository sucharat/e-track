import React, { useState, useEffect } from "react";
import axios from "axios";
import { url, getLocalData } from "../../helper/help";
import "./Notification.css";

const Notification = ({ onNotificationsViewed }) => {
  const [notifications, setNotifications] = useState([]); // Combined notifications array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime());
  
  // Get user role from localStorage
  const currentUserRole = localStorage.getItem("empType");
  const isAdmin = currentUserRole === "manager" || currentUserRole === "admin" || currentUserRole === "user";


  console.log(`User role: ${currentUserRole}`);
  // Force "all" view mode for admin and manager roles
  const [viewMode, setViewMode] = useState(isAdmin ? "all" : "personal");

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDateTime());
    }, 10000);
    
    return () => clearInterval(timer);
  }, [viewMode]);
  
  // Notify parent component when unread notifications are viewed
  useEffect(() => {
    if (onNotificationsViewed && !loading && viewMode === "personal") {
      const unreadCount = notifications.filter(n => n.status === "unread").length;
      onNotificationsViewed(unreadCount);
    }
  }, [notifications, loading, onNotificationsViewed, viewMode]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = getLocalData("token");
      
      if (!token) {
        setError("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่");
        setLoading(false);
        return;
      }
      
      // For admin/manager: always use the "all" endpoint
      // For regular users: use personal endpoint 
      const endpoint = viewMode === "all" 
        ? `${url}/api/Notification/all?limit=20&markAsRead=false` 
        : `${url}/api/Notification?limit=10&markAsRead=false`;
      
      console.log(`Fetching notifications from ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Store all notifications in a single array
        const allNotifications = response.data.data || [];
        
        // Sort notifications by creation date (newest first)
        allNotifications.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setNotifications(allNotifications);
        console.log(`Found ${allNotifications.length} notifications in ${viewMode} mode`);
      } else {
        setError(response.data.message || "Failed to load notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      setExpandedNotification(expandedNotification === notificationId ? null : notificationId);

      if (expandedNotification === notificationId) {
        return;
      }

      const token = getLocalData("token");
      const notification = notifications.find(n => n.notification_id === notificationId);

      if (notification && notification.status === "unread" && viewMode === "personal") {
        // Update notification status locally
        const updatedNotifications = notifications.map(n => {
          if (n.notification_id === notificationId) {
            return {
              ...n,
              status: "read",
              read_at: new Date().toISOString()
            };
          }
          return n;
        });
        
        setNotifications(updatedNotifications);

        // Update on server
        await axios.put(`${url}/api/Notification/MarkAsRead/${notificationId}`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (onNotificationsViewed) {
          const unreadCount = updatedNotifications.filter(n => n.status === "unread").length;
          onNotificationsViewed(unreadCount);
        }
      }
      
      // Always fetch the latest details
      const response = await axios.get(`${url}/api/Notification/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const updatedNotification = response.data.data;
        
        // Update notification in the list
        setNotifications(prev => 
          prev.map(notif => 
            notif.notification_id === notificationId ? updatedNotification : notif
          )
        );
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };
  
  const toggleViewMode = () => {
    // Only for non-admin users
    if (!isAdmin) {
      const newMode = viewMode === "personal" ? "all" : "personal";
      setViewMode(newMode);
      setExpandedNotification(null);
    }
  };
  
  // Helper function to get current date and time formatted
  function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  // Helper function to format date/time for display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateTimeStr;
    }
  };
  
  // Helper function to get request details
  const getRequestTypeDetails = (notification) => {
    if (!notification.request) return "No details available!";
    const request = notification.request;
    let details = `Type: ${request.request_type === 'patient_escort' ? 'Patient Escort' : 
                  request.request_type === 'translator' ? 'Translator' : request.request_type}`;
    if (request.patient_hn) details += ` | HN: ${request.patient_hn}`;
    if (request.priority) details += ` | Priority: ${request.priority}`;
    if (request.status) details += ` | Status: ${request.status}`;
    return details;
  };

  // Helper function to get badge color based on request priority
  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'priority-badge urgent';
      case 'emergency': return 'priority-badge emergency';
      default: return 'priority-badge normal';
    }
  };

  const renderNotification = (notification) => {
    const isExpanded = expandedNotification === notification.notification_id;
    const request = notification.request || {};
    const priority = request.priority || 'Normal';
    const requestType = request.request_type || '';
    const isUnread = notification.status === "unread";
    
    return (
      <div 
        key={notification.notification_id} 
        className={`notification-item ${isExpanded ? 'expanded' : ''} ${isUnread ? 'unread' : 'read'}`}
        onClick={() => handleNotificationClick(notification.notification_id)}
      >
        <div className="notification-header">
          <div className="notification-title">
            {/* Read status indicator */}
            <span className={`read-status ${isUnread ? 'unread-status' : 'read-status'}`}>
              {isUnread ? 'ยังไม่อ่าน' : 'อ่านแล้ว'}
            </span>
            
            <span>{notification.title}</span>
            {priority && (
              <span className={getPriorityBadgeClass(priority)}>
                {priority}
              </span>
            )}
            
            {viewMode === "all" && (
              <span className="recipient-badge">
                To: {notification.recipient_name || notification.recipient_id || "Unknown"}
              </span>
            )}
          </div>
          <div className="notification-time">
            {formatDateTime(notification.created_at)}
          </div>
        </div>
        
        <div className="notification-message">
          {notification.message}
          
          {requestType && (
            <div className="request-type-tag">
              {requestType === 'patient_escort' ? 'Patient Escort' : 
               requestType === 'translator' ? 'Translator' : requestType}
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="notification-details">
            <div className="detail-item">
              <span className="detail-label">Request Detail:</span>
              <span className="detail-value">{getRequestTypeDetails(notification)}</span>
            </div>
            
            {request.requestor && (
              <div className="detail-item">
                <span className="detail-label">Requestor:</span>
                <span className="detail-value">{request.requestor}</span>
              </div>
            )}
            
            {notification.sender_name && (
              <div className="detail-item">
                <span className="detail-label">From:</span>
                <span className="detail-value">{notification.sender_name}</span>
              </div>
            )}
            
            {notification.recipient_name && viewMode === "all" && (
              <div className="detail-item">
                <span className="detail-label">To:</span>
                <span className="detail-value">{notification.recipient_name}</span>
              </div>
            )}
            
            {notification.read_at && (
              <div className="detail-item">
                <span className="detail-label">Read At:</span>
                <span className="detail-value">{formatDateTime(notification.read_at)}</span>
              </div>
            )}
            
            {/* Display related equipment or languages if available */}
            {request.details && request.details.equipments && (
              <div className="detail-item">
                <span className="detail-label">Equipment:</span>
                <ul className="detail-list">
                  {request.details.equipments.map((item, index) => (
                    <li key={index}>{item.equipment_name} (Quantity: {item.qty})</li>
                  ))}
                </ul>
              </div>
            )}
            
            {request.details && request.details.languages && (
              <div className="detail-item">
                <span className="detail-label">Languages:</span>
                <ul className="detail-list">
                  {request.details.languages.map((item, index) => (
                    <li key={index}>{item.language_name}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* View more details button */}
            {request.request_id && (
              <div className="detail-actions">
                <button className="view-request-button">
                  More Details
                </button>
              </div>
            )}
          </div>
        )}
    
        {/* Expand/collapse indicator */}
        <div className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="notification-container">
      <div className="notification-header-container">
        <div className="notification-title-with-icon">
          <h2>Notification {viewMode === "all" ? "- All Users" : ""}</h2>
          
          {/* View mode toggle - only for non-admin/non-manager users */}
          {!isAdmin && (
            <div className="view-mode-toggle">  
              <button 
                className={`view-mode-button ${viewMode === "personal" ? "active" : ""}`}
                onClick={() => viewMode !== "personal" && toggleViewMode()}
              >
                My Notifications
              </button>
              <button 
                className={`view-mode-button ${viewMode === "all" ? "active" : ""}`}
                onClick={() => viewMode !== "all" && toggleViewMode()}
              >
                All Users
              </button>
            </div>
          )}
        </div>
        
        <div className="notification-date">
          Current Date: {currentTime}
        </div>
      </div>
      
      {loading ? (
        <div className="notification-loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="notification-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      ) : (
        <>
          {viewMode === "all" && (
            <div className="all-notifications-info">
              <span>Viewing notifications for all users. These notifications will not be marked as read automatically.</span>
            </div>
          )}
          
          {/* Combined notifications section */}
          {notifications.length > 0 ? (
            <div className="notification-section combined-section">
              <div className="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3>All Notifications ({notifications.length})</h3>
              </div>
              <div className="notification-list combined">
                {notifications.map(notification => renderNotification(notification))}
              </div>
            </div>
          ) : (
            <div className="notification-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <line x1="6" y1="4" x2="18" y2="16"></line>
              </svg>
              <span>No Notifications{viewMode === "all" ? " for any users" : ""}</span>
            </div>
          )}
          
          <button 
            className="refresh-button"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </>
      )}
    </div>
  );
};

export default Notification;