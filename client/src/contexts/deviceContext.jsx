import React, { createContext, useState, useContext, useEffect } from 'react';
import socketService from '../services/socketService';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  
  useEffect(() => {
    socketService.connect();
    
    // Lắng nghe sự kiện trạng thái thiết bị
    const handleDeviceStatus = (data) => {
      setDeviceConnected(data.status === 'online');
      console.log('Device status changed:', data.status);
    };
    
    socketService.on('device-status', handleDeviceStatus);
    
    return () => {
      socketService.off('device-status', handleDeviceStatus);
    };
  }, []);
  
  return (
    <DeviceContext.Provider value={{ 
      deviceConnected
    }}>
      {children}
    </DeviceContext.Provider>
  );
};

// Hook để sử dụng context
export const useDeviceContext = () => useContext(DeviceContext);

export default DeviceContext;