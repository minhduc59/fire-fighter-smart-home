import React, { useEffect, useState } from 'react';
import socketService from '../../services/socketService';
import './AlertNotification.css';

const AlertNotification = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socketService.connect();
    
    const handleDataUpdate = (data) => {
      if (data.alerts && data.alerts.length > 0) {
        const newAlerts = data.alerts.map(alert => ({
          ...alert,
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          autoActivation: data.autoActivation
        }));
        
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
      }
    };
    
    socketService.on('data-update', handleDataUpdate);
    
    return () => {
      socketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getAlertMessage = (alert) => {
    switch(alert.type) {
      case 'temperature':
        return `🌡️ Nhiệt độ cao: ${alert.value.toFixed(1)}°C`;
      case 'gas':
        return `💨 Khí gas cao: ${alert.value.toFixed(1)} ppm`;
      case 'auto-suppression':
        return alert.message;
      case 'system-error':
        return `❌ ${alert.message}`;
      default:
        return 'Cảnh báo không xác định';
    }
  };

  const getAlertIcon = (alert) => {
    switch(alert.type) {
      case 'temperature':
        return 'fas fa-thermometer-full';
      case 'gas':
        return 'fas fa-smog';
      case 'auto-suppression':
        return 'fas fa-robot';
      case 'system-error':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-bell';
    }
  };

  const getScenarioDetails = (scenario) => {
    switch(scenario) {
      case 'severe-fire':
        return {
          title: '🔥🔥 CHÁY NGHIÊM TRỌNG',
          color: '#dc3545',
          description: 'Cả nhiệt độ và khí gas đều cao'
        };
      case 'bedroom-fire':
        return {
          title: '🔥 CHÁY PHÒNG NGỦ',
          color: '#fd7e14',
          description: 'Nhiệt độ cao, ít khói'
        };
      case 'kitchen-gas-leak':
        return {
          title: '💨 RÒ GAS PHÒNG BẾP',
          color: '#ffc107',
          description: 'Khí gas cao, nhiệt độ bình thường'
        };
      default:
        return null;
    }
  };

  return (
    <div className="alert-container">
      <h3>
        <i className="fas fa-bell"></i>
        Cảnh báo & Hệ thống tự động
      </h3>
      {alerts.length === 0 ? (
        <p className="no-alerts">
          <i className="fas fa-check-circle"></i>
          Hệ thống hoạt động bình thường
        </p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => {
            const scenarioDetails = alert.scenario ? getScenarioDetails(alert.scenario) : null;
            
            return (
              <li key={alert.id} className={`alert-item ${alert.type}`}>
                <div className="alert-content">
                  <div className="alert-header">
                    <i className={getAlertIcon(alert)}></i>
                    <span className="alert-time">{alert.timestamp}</span>
                  </div>
                  
                  {scenarioDetails && (
                    <div className="scenario-info" style={{ borderLeft: `3px solid ${scenarioDetails.color}` }}>
                      <div className="scenario-title">{scenarioDetails.title}</div>
                      <div className="scenario-description">{scenarioDetails.description}</div>
                    </div>
                  )}
                  
                  <div className="alert-message">
                    {getAlertMessage(alert)}
                  </div>
                  
                  {alert.actions && (
                    <div className="actions-taken">
                      <div className="actions-title">🎯 Hành động đã thực hiện:</div>
                      <ul className="actions-list">
                        {Object.entries(alert.actions).map(([key, action]) => (
                          <li key={key}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <button 
                  className="dismiss-btn" 
                  onClick={() => dismissAlert(alert.id)}
                  title="Bỏ qua cảnh báo"
                >
                  &times;
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AlertNotification;