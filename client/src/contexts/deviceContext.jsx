import React, { createContext, useState, useContext, useEffect } from 'react';
import socketService from '../services/socketService';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [currentDevice, setCurrentDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  
  useEffect(() => {
    socketService.connect();
    
    // Lắng nghe sự kiện kết nối thiết bị mới
    const handleDeviceStatus = (data) => {
      if (data.status === 'online') {
        // Khi thiết bị mới kết nối, đặt nó làm thiết bị hiện tại
        setCurrentDevice(data.deviceId);
        
        // Cập nhật danh sách thiết bị kết nối
        setConnectedDevices(prev => {
          if (!prev.includes(data.deviceId)) {
            return [...prev, data.deviceId];
          }
          return prev;
        });
      } else {
        // Khi thiết bị ngắt kết nối, xóa khỏi danh sách
        setConnectedDevices(prev => prev.filter(id => id !== data.deviceId));
        
        // Nếu thiết bị hiện tại ngắt kết nối, chọn thiết bị kết nối khác (nếu có)
        if (currentDevice === data.deviceId) {
          setCurrentDevice(prevDevices => prevDevices.length > 0 ? prevDevices[0] : null);
        }
      }
    };
    
    socketService.on('device-status', handleDeviceStatus);
    
    return () => {
      socketService.off('device-status', handleDeviceStatus);
    };
  }, [currentDevice]);
  
  // Hàm chọn thiết bị hiện tại
  const selectDevice = (deviceId) => {
    setCurrentDevice(deviceId);
  };
  
  return (
    <DeviceContext.Provider value={{ 
      currentDevice, 
      connectedDevices,
      selectDevice 
    }}>
      {children}
    </DeviceContext.Provider>
  );
};

// Hook để sử dụng context
export const useDeviceContext = () => useContext(DeviceContext);

export default DeviceContext;