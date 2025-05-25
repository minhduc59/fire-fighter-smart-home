import React, { useEffect, useState } from 'react';
import socketService from '../../services/socketService';
import './DeviceControl.css';

const DeviceControl = ({ deviceId }) => {
  const [deviceStatus, setDeviceStatus] = useState('offline');
  const [controls, setControls] = useState({
    pump: false,
    servo: false
  });

  useEffect(() => {
    socketService.connect();
    
    // Lắng nghe sự kiện cập nhật trạng thái thiết bị
    const handleDeviceStatus = (data) => {
      if (data.deviceId === deviceId) {
        setDeviceStatus(data.status);
      }
    };
    
    socketService.on('device-status', handleDeviceStatus);
    
    // Khi component mount, gọi API để lấy trạng thái hiện tại
    const fetchDeviceStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.device) {
            setDeviceStatus(data.device.status);
            setControls(data.device.controls || { pump: false, servo: false });
          }
        }
      } catch (error) {
        console.error('Error fetching device status:', error);
      }
    };
    
    fetchDeviceStatus();
    
    return () => {
      socketService.off('device-status', handleDeviceStatus);
    };
  }, [deviceId]);

  const handleControlToggle = (control) => {
    const newValue = !controls[control];
    socketService.emit('control-device', {
      deviceId,
      control,
      value: newValue
    });
    
    // Optimistic update
    setControls(prev => ({
      ...prev,
      [control]: newValue
    }));
  };

  return (
    <div className="device-control-panel">
      <h3>Điều khiển thiết bị</h3>
      
      <div className="device-status">
        <span className={`status-indicator ${deviceStatus}`}></span>
        <span>Trạng thái: {deviceStatus === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
      </div>
      
      <div className="control-buttons">
        <div className="control-item">
          <span>Bơm nước</span>
          <button 
            className={`control-btn ${controls.pump ? 'active' : ''}`} 
            onClick={() => handleControlToggle('pump')}
            disabled={deviceStatus !== 'online'}
          >
            {controls.pump ? 'TẮT' : 'BẬT'}
          </button>
        </div>
        
        <div className="control-item">
          <span>Servo</span>
          <button 
            className={`control-btn ${controls.servo ? 'active' : ''}`} 
            onClick={() => handleControlToggle('servo')}
            disabled={deviceStatus !== 'online'}
          >
            {controls.servo ? 'TẮT' : 'BẬT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;