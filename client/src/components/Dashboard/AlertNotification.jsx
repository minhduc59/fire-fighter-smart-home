import React, { useEffect, useState } from 'react';
import socketService from '../../services/socketService';
import './AlertNotification.css';

const AlertNotification = ({ deviceId }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socketService.connect();
    
    const handleDataUpdate = (data) => {
      if (data.deviceId === deviceId && data.alerts && data.alerts.length > 0) {
        const newAlerts = data.alerts.map(alert => ({
          ...alert,
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString()
        }));
        
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Giới hạn 10 cảnh báo
      }
    };
    
    socketService.on('data-update', handleDataUpdate);
    
    return () => {
      socketService.off('data-update', handleDataUpdate);
    };
  }, [deviceId]);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="alert-container">
      <h3>Cảnh báo</h3>
      {alerts.length === 0 ? (
        <p className="no-alerts">Không có cảnh báo</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-item ${alert.type}`}>
              <div className="alert-content">
                <span className="alert-time">{alert.timestamp}</span>
                <span className="alert-message">
                  {alert.type === 'temperature' 
                    ? `Nhiệt độ cao: ${alert.value}°C` 
                    : `Khí gas cao: ${alert.value} ppm`}
                </span>
              </div>
              <button 
                className="dismiss-btn" 
                onClick={() => dismissAlert(alert.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertNotification;