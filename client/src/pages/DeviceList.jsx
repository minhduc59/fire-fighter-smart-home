import React, { useState, useEffect } from 'react';
import { getDevices } from '../services/apiService';
import socketService from '../services/socketService';
import { useDeviceContext } from '../contexts/deviceContext';
import './DeviceList.css';

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentDevice, selectDevice } = useDeviceContext();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await getDevices();
        if (response.success) {
          setDevices(response.devices);
        } else {
          setError('Không thể tải dữ liệu thiết bị');
        }
      } catch (err) {
        setError(`Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    socketService.connect();
    
    const handleDeviceStatus = (data) => {
      setDevices(prev => 
        prev.map(device => 
          device.deviceId === data.deviceId 
            ? { ...device, status: data.status } 
            : device
        )
      );
    };
    
    socketService.on('device-status', handleDeviceStatus);
    
    return () => {
      socketService.off('device-status', handleDeviceStatus);
    };
  }, []);

  const formatLastSeen = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const handleDeviceSelect = (deviceId) => {
    selectDevice(deviceId);
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu thiết bị...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="device-list-container">
      <h1>Danh sách thiết bị</h1>
      
      {devices.length === 0 ? (
        <div className="no-devices">Không có thiết bị nào được kết nối</div>
      ) : (
        <table className="device-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Trạng thái</th>
              <th>Lần cuối hoạt động</th>
              <th>Điều khiển</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr 
                key={device._id} 
                className={`${device.status} ${currentDevice === device.deviceId ? 'selected' : ''}`}
              >
                <td>{device.deviceId}</td>
                <td>{device.name || device.deviceId}</td>
                <td>
                  <span className={`status-badge ${device.status}`}>
                    {device.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                  </span>
                </td>
                <td>{formatLastSeen(device.lastSeen)}</td>
                <td>
                  <div className="device-controls">
                    <span>Bơm: {device.controls?.pump ? 'Bật' : 'Tắt'}</span>
                    <span>Servo: {device.controls?.servo ? 'Bật' : 'Tắt'}</span>
                  </div>
                </td>
                <td>
                  <button 
                    className={`select-btn ${currentDevice === device.deviceId ? 'active' : ''}`}
                    onClick={() => handleDeviceSelect(device.deviceId)}
                    disabled={currentDevice === device.deviceId}
                  >
                    {currentDevice === device.deviceId ? 'Đã chọn' : 'Chọn'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeviceList;