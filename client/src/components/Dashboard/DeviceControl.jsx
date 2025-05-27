import React, { useEffect, useState } from 'react';
import socketService from '../../services/socketService';
import { useDeviceContext } from '../../contexts/deviceContext';
import './DeviceControl.css';

const DeviceControl = () => {
  const { deviceConnected } = useDeviceContext();
  const [controls, setControls] = useState({
    fan: false,
    door: false,
    fireSuppression: {
      bedroom: false,
      kitchen: false,
      all: false
    }
  });

  useEffect(() => {
    socketService.connect();
    
    // Lấy trạng thái hiện tại khi component mount
    const fetchDeviceStatus = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/devices`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.device) {
            setControls(data.device.controls || {
              fan: false,
              door: false,
              fireSuppression: {
                bedroom: false,
                kitchen: false,
                all: false
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching device status:', error);
      }
    };

    // Lắng nghe cập nhật điều khiển từ server
    const handleControlUpdate = (data) => {
      const { control, value, subControl } = data;
      
      setControls(prev => {
        const newControls = { ...prev };
        
        if (subControl) {
          if (!newControls[control]) {
            newControls[control] = {};
          }
          newControls[control][subControl] = value;
          
          // Logic đặc biệt cho fire suppression
          if (control === 'fireSuppression') {
            if (subControl === 'all' && value) {
              newControls.fireSuppression.bedroom = false;
              newControls.fireSuppression.kitchen = false;
            } else if ((subControl === 'bedroom' || subControl === 'kitchen') && value) {
              newControls.fireSuppression.all = false;
            }
          }
        } else {
          newControls[control] = value;
        }
        
        return newControls;
      });
    };
    
    socketService.on('control-update', handleControlUpdate);
    fetchDeviceStatus();
    
    return () => {
      socketService.off('control-update', handleControlUpdate);
    };
  }, []);

  const handleControlToggle = (control, subControl = null) => {
    const currentValue = subControl ? controls[control]?.[subControl] : controls[control];
    const newValue = !currentValue;
    
    socketService.emit('control-device', {
      control,
      value: newValue,
      subControl
    });
    
    // Optimistic update
    setControls(prev => {
      const newControls = { ...prev };
      
      if (subControl) {
        if (!newControls[control]) {
          newControls[control] = {};
        }
        newControls[control][subControl] = newValue;
        
        // Logic đặc biệt cho fire suppression
        if (control === 'fireSuppression') {
          if (subControl === 'all' && newValue) {
            newControls.fireSuppression.bedroom = false;
            newControls.fireSuppression.kitchen = false;
          } else if ((subControl === 'bedroom' || subControl === 'kitchen') && newValue) {
            newControls.fireSuppression.all = false;
          }
        }
      } else {
        newControls[control] = newValue;
      }
      
      return newControls;
    });
  };

  return (
    <div className="device-control-panel">
      <h3>Điều khiển hệ thống FireGuard</h3>
      
      <div className="device-status">
        <span className={`status-indicator ${deviceConnected ? 'online' : 'offline'}`}></span>
        <span>Trạng thái: {deviceConnected ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
      </div>
      
      <div className="control-sections">
        {/* Điều khiển cơ bản */}
        <div className="control-section">
          <h4>Điều khiển cơ bản</h4>
          <div className="control-buttons">
            <div className="control-item">
              <span>
                <i className="fas fa-fan"></i>
                Quạt
              </span>
              <button 
                className={`control-btn ${controls.fan ? 'active' : ''}`} 
                onClick={() => handleControlToggle('fan')}
                disabled={!deviceConnected}
              >
                {controls.fan ? 'TẮT' : 'BẬT'}
              </button>
            </div>
            
            <div className="control-item">
              <span>
                <i className="fas fa-door-open"></i>
                Cửa
              </span>
              <button 
                className={`control-btn ${controls.door ? 'active' : ''}`} 
                onClick={() => handleControlToggle('door')}
                disabled={!deviceConnected}
              >
                {controls.door ? 'ĐÓNG' : 'MỞ'}
              </button>
            </div>
          </div>
        </div>

        {/* Hệ thống phun nước chữa cháy */}
        <div className="control-section fire-suppression">
          <h4>
            <i className="fas fa-fire-extinguisher"></i>
            Hệ thống phun nước chữa cháy
          </h4>
          <div className="control-buttons">
            <div className="control-item">
              <span>
                <i className="fas fa-bed"></i>
                Phòng ngủ
              </span>
              <button 
                className={`control-btn fire-btn ${controls.fireSuppression?.bedroom ? 'active' : ''}`} 
                onClick={() => handleControlToggle('fireSuppression', 'bedroom')}
                disabled={!deviceConnected}
              >
                {controls.fireSuppression?.bedroom ? 'TẮT' : 'KÍCH HOẠT'}
              </button>
            </div>
            
            <div className="control-item">
              <span>
                <i className="fas fa-utensils"></i>
                Phòng bếp
              </span>
              <button 
                className={`control-btn fire-btn ${controls.fireSuppression?.kitchen ? 'active' : ''}`} 
                onClick={() => handleControlToggle('fireSuppression', 'kitchen')}
                disabled={!deviceConnected}
              >
                {controls.fireSuppression?.kitchen ? 'TẮT' : 'KÍCH HOẠT'}
              </button>
            </div>
            
            <div className="control-item emergency">
              <span>
                <i className="fas fa-exclamation-triangle"></i>
                Cả hai phòng
              </span>
              <button 
                className={`control-btn emergency-btn ${controls.fireSuppression?.all ? 'active' : ''}`} 
                onClick={() => handleControlToggle('fireSuppression', 'all')}
                disabled={!deviceConnected}
              >
                {controls.fireSuppression?.all ? 'TẮT' : 'KÍCH HOẠT KHẨN CẤP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;