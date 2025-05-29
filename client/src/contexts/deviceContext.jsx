import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);

  // Hàm yêu cầu trạng thái thiết bị từ server
  const requestDeviceStatus = useCallback(() => {
    console.log("📱 Requesting device status from server");
    socketService.emit('request-device-status');
  }, []);
  
  useEffect(() => {
    console.log("🔄 DeviceContext initialized");
    
    // Kết nối socket
    const socket = socketService.connect();
    console.log("🔌 Socket initialized:", socket ? "success" : "failed");
    
    // Xử lý sự kiện device-status
    const handleDeviceStatus = (data) => {
      console.log("📱 Device status received:", data);
      const isOnline = data.status === 'online';
      setDeviceConnected(isOnline);
      setLastStatusUpdate(new Date());
      console.log(`📱 Device is now: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    };
    
    // Đăng ký lắng nghe sự kiện
    socketService.on('device-status', handleDeviceStatus);
    
    // Chủ động yêu cầu trạng thái sau khi kết nối
    const requestStatus = () => {
      if (socketService.isConnected()) {
        requestDeviceStatus();
      }
    };
    
    // Yêu cầu ngay lập tức
    requestStatus();
    
    // Yêu cầu lại mỗi 10 giây (nếu cần)
    const statusInterval = setInterval(requestStatus, 10000);
    
    return () => {
      console.log("🧹 Cleaning up DeviceContext");
      socketService.off('device-status', handleDeviceStatus);
      clearInterval(statusInterval);
    };
  }, [requestDeviceStatus]);
  
  return (
    <DeviceContext.Provider value={{ 
      deviceConnected,
      lastStatusUpdate,
      requestDeviceStatus
    }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = () => useContext(DeviceContext);

export default DeviceContext;