import { io } from "socket.io-client";

class SocketService {
    constructor() {
        this.socket = null;
    }
    
    connect(serverUrl = process.env.REACT_APP_SOCKET_URL) {  
        if (this.socket) return;
        
        console.log("Connecting to server at:", serverUrl);
        this.socket = io(serverUrl);
        
        this.socket.on("connect", () => {
            console.log("Connected to server with ID:", this.socket.id);
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        // Thêm debug listener để xem tất cả các sự kiện nhận được
        this.socket.onAny((event, ...args) => {
            console.log(`[Socket] Received event: ${event}`, args);
        });

        return this.socket;
    }
   
    on(event, callback) {
        if (!this.socket) this.connect();
        console.log(`[Socket] Registering listener for event: ${event}`);
        this.socket.on(event, callback);
    }
    
    off(event, callback) {
        if (!this.socket) return;
        console.log(`[Socket] Removing listener for event: ${event}`);
        this.socket.off(event, callback);
    }
    
    emit(event, data) {
        if (!this.socket) this.connect();
        console.log(`[Socket] Emitting event: ${event}`, data);
        this.socket.emit(event, data);
    }
    
    disconnect() {
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
    }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;