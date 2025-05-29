import io from "socket.io-client"; // ✅ Cú pháp đúng cho socket.io-client v2

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
    }

    connect(serverUrl = process.env.REACT_APP_SOCKET_URL) {
        // Nếu đã kết nối, trả về socket hiện tại
        if (this.socket && this.connected) return this.socket;

        // Nếu đã thử kết nối quá nhiều lần, reset lại
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.log("Resetting connection after too many attempts");
            this.disconnect();
            this.connectionAttempts = 0;
        }

        const url = serverUrl || 'http://localhost:5000';

        // *** Thêm log rõ ràng khi bắt đầu kết nối ***
        console.log(`🔌 Starting connection to server at: ${url} (Attempt ${this.connectionAttempts + 1})`);

        this.connectionAttempts++;

        try {
            this.socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000, // Tăng timeout lên 20 giây
                forceNew: true
            });

            this.socket.on("connect", () => {
                console.log(`✅ Connected to server with ID: ${this.socket.id}`);
                this.connected = true;
                this.connectionAttempts = 0; // Reset counter on success

                // Yêu cầu trạng thái thiết bị ngay sau khi kết nối
                this.socket.emit('request-device-status');
                console.log("📱 Requested device status");

                // Đăng ký web client sau đó
                this.socket.emit('web-client-connect');
                console.log("🌐 Registered as web client");
            });

            this.socket.on("connect_error", (error) => {
                console.error(`❌ Connection error: ${error.message}`);
                this.connected = false;
            });

            this.socket.on("disconnect", (reason) => {
                console.log(`🔌 Disconnected from server: ${reason}`);
                this.connected = false;
            });

            this.socket.on("reconnect", (attemptNumber) => {
                console.log(`🔄 Reconnected to server (attempt: ${attemptNumber})`);
                this.connected = true;

                // Yêu cầu lại trạng thái thiết bị
                this.socket.emit('request-device-status');
                this.socket.emit('web-client-connect');
            });

            // Debug listener với emojis để dễ phân biệt
            this.socket.onAny((event, ...args) => {
                console.log(`📡 [Socket] Received event: ${event}`, args);
            });

            return this.socket;
        } catch (error) {
            console.error(`💥 Error creating socket connection: ${error}`);
            this.connected = false;
            return null;
        }
    }

    // Các phương thức khác đã ok, không cần thay đổi
    on(event, callback) {
        if (!this.socket) {
            const socket = this.connect();
            if (!socket) {
                console.error(`❌ Cannot register listener: socket is null`);
                return this;
            }
        }

        console.log(`🎧 [Socket] Registering listener for event: ${event}`);
        this.socket.on(event, callback);
        return this;
    }


    off(event, callback) {
        if (!this.socket) return this;
        console.log(`🔕 [Socket] Removing listener for event: ${event}`);
        this.socket.off(event, callback);
        return this;
    }

    emit(event, data) {
        if (!this.socket) this.connect();
        console.log(`📤 [Socket] Emitting event: ${event}`, data);
        this.socket.emit(event, data);
        return this;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            console.log("🔌 Socket manually disconnected");
        }
        return this;
    }

    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
