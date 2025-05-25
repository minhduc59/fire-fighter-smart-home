import React, { useEffect, useState } from 'react';
import './CurrentStats.css';

const CurrentStats = ({ data }) => {
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    // Tạo hiệu ứng highlight khi có dữ liệu mới
    setIsUpdated(true);
    const timer = setTimeout(() => {
      setIsUpdated(false);
    }, 600); // Thời gian hiệu ứng

    return () => clearTimeout(timer);
  }, [data.temperature, data.humidity, data.gasLevel]);

  const getStatusClass = (value, thresholds) => {
    if (value >= thresholds.high) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  };

  const temperatureClass = getStatusClass(data.temperature || 0, { warning: 50, high: 60 });
  const humidityClass = getStatusClass(data.humidity || 0, { warning: 70, high: 85 });
  const gasClass = getStatusClass(data.gasLevel || 0, { warning: 200, high: 300 });

  return (
    <div className={`current-stats ${isUpdated ? 'data-updated' : ''}`}>
      <h3>Thông số hiện tại</h3>
      
      <div className="stat-grid">
        <div className={`stat-card ${temperatureClass}`}>
          <div className="stat-icon">
            <i className="fas fa-thermometer-half"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Nhiệt độ</span>
            <span className="stat-value">{data.temperature?.toFixed(1) || 0}°C</span>
          </div>
        </div>
        
        <div className={`stat-card ${humidityClass}`}>
          <div className="stat-icon">
            <i className="fas fa-tint"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Độ ẩm</span>
            <span className="stat-value">{data.humidity?.toFixed(1) || 0}%</span>
          </div>
        </div>
        
        <div className={`stat-card ${gasClass}`}>
          <div className="stat-icon">
            <i className="fas fa-smog"></i>
          </div>
          <div className="stat-details">
            <span className="stat-label">Nồng độ khí gas</span>
            <span className="stat-value">{data.gasLevel?.toFixed(1) || 0} ppm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStats;