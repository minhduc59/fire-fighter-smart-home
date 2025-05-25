import React, { useEffect, useState } from 'react';
import RealtimeChart from '../components/Dashboard/RealtimeChart';
import DeviceControl from '../components/Dashboard/DeviceControl';
import CurrentStats from '../components/Dashboard/CurrentStats';
import AlertNotification from '../components/Dashboard/AlertNotification';
import socketService from '../services/socketService';
import { useDeviceContext } from '../contexts/deviceContext';
import { Navigate } from 'react-router-dom';
import './Dashboard.css';
const Dashboard = () => {
  const { currentDevice, connectedDevices } = useDeviceContext();
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    humidity: 0,
    gasLevel: 0,
    timestamp: new Date()
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Đặt useEffect trước các câu lệnh return có điều kiện
  useEffect(() => {
    // Kết nối socket khi component mount
    socketService.connect();
    
    // Xử lý nhận dữ liệu từ thiết bị
    const handleDataUpdate = (data) => {
      if (data.deviceId === currentDevice) {
        // Cập nhật dữ liệu ngay khi nhận được từ thiết bị
        setCurrentData({
          temperature: data.temperature,
          humidity: data.humidity,
          gasLevel: data.gasLevel,
          timestamp: new Date(data.timestamp || Date.now())
        });
        console.log('Received data update:', data);
      }
    };
    
    // Đăng ký lắng nghe sự kiện data-update
    socketService.on('data-update', handleDataUpdate);
    
    // Cập nhật thời gian hiện tại mỗi giây
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Cleanup khi component unmount
    return () => {
      socketService.off('data-update', handleDataUpdate);
      clearInterval(timerInterval);
    };
  }, [currentDevice]);

  // Format thời gian hiện tại
  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Format thời gian cập nhật dữ liệu cuối
  const formatLastUpdateTime = (date) => {
    return date.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Sau khi đã gọi tất cả các hooks, bây giờ mới kiểm tra điều kiện
  // Nếu không có thiết bị kết nối, chuyển hướng tới trang danh sách thiết bị
  if (!currentDevice && connectedDevices.length === 0) {
    return <Navigate to="/devices" />;
  }
  
  // Nếu không có thiết bị nào được chọn nhưng có thiết bị trong danh sách, hiển thị thông báo chọn thiết bị
  if (!currentDevice && connectedDevices.length > 0) {
    return (
      <div className="dashboard-container">
        <h3>Dashboard</h3>
        <div className="select-device-message">
          <p>Vui lòng chọn một thiết bị từ <a href="/devices">danh sách thiết bị</a> để xem dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - Thiết bị: {currentDevice}</h1>
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
            <RealtimeChart dataType="temperature" deviceId={currentDevice} />
          </div>
          <div className="chart-item">
            <RealtimeChart dataType="humidity" deviceId={currentDevice} />
          </div>
          <div className="chart-item">
            <RealtimeChart dataType="gasLevel" deviceId={currentDevice} />
          </div>
        </div>
        
        <div className="controls-section">
          <DeviceControl deviceId={currentDevice} />
          <AlertNotification deviceId={currentDevice} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;