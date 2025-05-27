import React, { useEffect, useState } from 'react';
import RealtimeChart from '../components/Dashboard/RealtimeChart';
import DeviceControl from '../components/Dashboard/DeviceControl';
import CurrentStats from '../components/Dashboard/CurrentStats';
import AlertNotification from '../components/Dashboard/AlertNotification';
import socketService from '../services/socketService';
import { useDeviceContext } from '../contexts/deviceContext';
import './Dashboard.css';

const Dashboard = () => {
  const { deviceConnected } = useDeviceContext();
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    humidity: 0,
    gasLevel: 0,
    timestamp: new Date()
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    socketService.connect();
    
    // Xử lý nhận dữ liệu từ thiết bị (không cần kiểm tra deviceId)
    const handleDataUpdate = (data) => {
      setCurrentData({
        temperature: data.temperature,
        humidity: data.humidity,
        gasLevel: data.gasLevel,
        timestamp: new Date(data.timestamp || Date.now())
      });
      console.log('Received data update:', data);
    };
    
    socketService.on('data-update', handleDataUpdate);
    
    // Cập nhật thời gian hiện tại mỗi giây
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      socketService.off('data-update', handleDataUpdate);
      clearInterval(timerInterval);
    };
  }, []);

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (!deviceConnected) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard - ESP8266 Fire Guard</h1>
        <div className="select-device-message">
          <p>Thiết bị ESP8266 chưa kết nối. Vui lòng kiểm tra kết nối thiết bị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - ESP8266 Fire Guard</h1>
        <div className="realtime-clock">
          <div className="clock-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="clock-time">{formatCurrentTime(currentTime)}</div>
        </div>
      </div>
      
      <CurrentStats data={currentData} />
      
      <div className="dashboard-grid">
        <div className="charts-section">
          <div className="chart-item">
            <RealtimeChart dataType="temperature" />
          </div>
          <div className="chart-item">
            <RealtimeChart dataType="humidity" />
          </div>
          <div className="chart-item">
            <RealtimeChart dataType="gasLevel" />
          </div>
        </div>
        
        <div className="controls-section">
          <DeviceControl />
          <AlertNotification />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;