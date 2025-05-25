import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { getHistoricalData } from '../services/apiService';
import { useDeviceContext } from '../contexts/deviceContext';
import { Navigate } from 'react-router-dom';
import './History.css';

const History = () => {
  const { currentDevice, connectedDevices } = useDeviceContext();
  
  const [filter, setFilter] = useState({
    dataType: 'temperature',
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!currentDevice) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getHistoricalData(
        currentDevice,
        `${filter.from}T00:00:00Z`,
        `${filter.to}T23:59:59Z`
      );
      
      if (result.success) {
        processChartData(result.data);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu lịch sử');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const labels = data.map(item => {
      const date = new Date(item.timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    });
    
    const values = data.map(item => item[filter.dataType]);
    
    setChartData({
      labels,
      datasets: [
        {
          label: getLabel(filter.dataType),
          data: values,
          borderColor: getColor(filter.dataType),
          backgroundColor: `${getColor(filter.dataType)}33`,
          tension: 0.4
        }
      ]
    });
  };

  function getLabel(type) {
    switch(type) {
      case 'temperature': return 'Nhiệt độ (°C)';
      case 'humidity': return 'Độ ẩm (%)';
      case 'gasLevel': return 'Nồng độ khí gas (ppm)';
      default: return 'Dữ liệu';
    }
  }

  function getColor(type) {
    switch(type) {
      case 'temperature': return 'rgb(255, 99, 132)';
      case 'humidity': return 'rgb(53, 162, 235)';
      case 'gasLevel': return 'rgb(255, 159, 64)';
      default: return 'rgb(75, 192, 192)';
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Di chuyển useEffect lên trước các câu lệnh return có điều kiện
  useEffect(() => {
    if (currentDevice) {
      fetchData();
    }
  }, [currentDevice, filter.dataType, filter.from, filter.to]);  // Thêm các dependencies

  // Sử dụng biến để xác định nội dung hiển thị thay vì return sớm
  let content;
  
  if (!currentDevice && connectedDevices.length === 0) {
    content = <Navigate to="/devices" />;
  } else if (!currentDevice && connectedDevices.length > 0) {
    content = (
      <div className="history-page">
        <h1>Lịch sử dữ liệu</h1>
        <div className="select-device-message">
          <p>Vui lòng chọn một thiết bị từ <a href="/devices">danh sách thiết bị</a> để xem lịch sử</p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="history-page">
        <h1>Lịch sử dữ liệu - Thiết bị: {currentDevice}</h1>
        
        <form className="filter-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại dữ liệu:</label>
            <select name="dataType" value={filter.dataType} onChange={handleFilterChange}>
              <option value="temperature">Nhiệt độ</option>
              <option value="humidity">Độ ẩm</option>
              <option value="gasLevel">Khí gas</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Từ ngày:</label>
            <input 
              type="date" 
              name="from" 
              value={filter.from}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="form-group">
            <label>Đến ngày:</label>
            <input 
              type="date" 
              name="to" 
              value={filter.to}
              onChange={handleFilterChange}
            />
          </div>
          
          <button type="submit" className="btn-search">Tìm kiếm</button>
        </form>
        
        <div className="chart-container">
          {loading && <div className="loading">Đang tải dữ liệu...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && chartData && (
            <Line 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: `Dữ liệu ${getLabel(filter.dataType)} theo thời gian`
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }}
            />
          )}
          {!loading && !error && !chartData && (
            <div className="no-data">Không có dữ liệu phù hợp</div>
          )}
        </div>
      </div>
    );
  }

  return content;
};

export default History;