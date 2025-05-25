import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL:", API_URL);

export const getHistoricalData = async(deviceId, from, to) => {
    try{
        const response = await axios.get(`${API_URL}/sensors/history`,{
            params: { deviceId, from, to }
        });
        return response.data;

    }catch(error){
        console.error("Error fetching historical data:", error);
        throw error;
    }
}
export const getDevices = async() => {
    try{
        const response = await axios.get(`${API_URL}/devices`);
        return response.data;
    }catch(error){
        console.error("Error fetching devices:", error);
        throw error;
    }
}
export const getDevice = async(deviceId) => {
    try{
        const response = await axios.get(`${API_URL}/devices/${deviceId}`);
        return response.data;
    }catch(error){
        console.error("Error fetching device:", error);
        throw error;
    }
}
