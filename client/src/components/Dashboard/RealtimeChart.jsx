import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import socketService from '../../services/socketService';
import './RealtimeChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RealtimeChart = ({ dataType }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: getLabel(dataType),
        data: [],
        borderColor: getColor(dataType),
        backgroundColor: `${getColor(dataType)}55`,
        tension: 0.3,
        fill: false
      },
    ],
  });

  const MAX_DATA_POINTS = 10;

  function getLabel(type) {
    switch(type) {
      case 'temperature': return 'Nhiệt độ (°C)';
      case 'humidity': return 'Độ ẩm (%)';
      case 'gasLevel': return 'Khí gas (ppm)';
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

  useEffect(() => {
    socketService.connect();
    
    // Xử lý nhận dữ liệu realtime 
    const handleDataUpdate = (data) => {
      const timestamp = new Date().toLocaleTimeString();
      
      setChartData(prevData => {
        const newLabels = [...prevData.labels, timestamp];
        const newData = [...prevData.datasets[0].data, data[dataType]];
        
        if (newLabels.length > MAX_DATA_POINTS) {
          newLabels.shift();
          newData.shift();
        }
        
        return {
          labels: newLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: newData,
            }
          ]
        };
      });
    };
    
    socketService.on('data-update', handleDataUpdate);
    
    return () => {
      socketService.off('data-update', handleDataUpdate);
    };
  }, [dataType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${getLabel(dataType)} theo thời gian thực`,
        font: {
          size: 16
        }
      }
    },
    animation: {
      duration: 500
    }
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RealtimeChart;