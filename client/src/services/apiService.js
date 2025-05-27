import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL:", API_URL);

export const getHistoricalData = async(from, to) => {
    try{
        const response = await axios.get(`${API_URL}/sensors/history`,{
            params: { from, to } 
        });
        return response.data;
    }catch(error){
        console.error("Error fetching historical data:", error);
        throw error;
    }
}

export const getDevice = async() => {
    try{
        const response = await axios.get(`${API_URL}/devices`);
        return response.data;
    }catch(error){
        console.error("Error fetching device:", error);
        throw error;
    }
}

export const updateDevice = async(deviceData) => {
    try{
        const response = await axios.put(`${API_URL}/devices`, deviceData);
        return response.data;
    }catch(error){
        console.error("Error updating device:", error);
        throw error;
    }
}

export const getStatistics = async(period = '24h') => {
    try{
        const response = await axios.get(`${API_URL}/sensors/statistics`, {
            params: { period }
        });
        return response.data;
    }catch(error){
        console.error("Error fetching statistics:", error);
        throw error;
    }
}