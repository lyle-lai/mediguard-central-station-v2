import { Client } from '@stomp/stompjs';
import { DeviceRealtimeDataDTO } from '../types';

const SOCKET_URL = 'ws://localhost:8080/ws-vitalsigns';
const TOPIC_VITALS = '/topic/vitals';

let client: Client | null = null;
let messageCallback: ((data: DeviceRealtimeDataDTO[]) => void) | null = null;

export const connectWebSocket = (onMessage: (data: DeviceRealtimeDataDTO[]) => void) => {
  // Update callback reference immediately
  messageCallback = onMessage;

  if (client && client.active) {
    console.log("WebSocket already active, updated callback");
    return;
  }

  if (client) {
    // Client exists but not active, try to activate or recreate?
    // Safer to deactivate first if in weird state
    try { client.deactivate(); } catch (e) { }
  }

  console.log("Initializing WebSocket Client...");
  client = new Client({
    brokerURL: SOCKET_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket Connected');
      client?.subscribe(TOPIC_VITALS, (message) => {
        if (message.body && messageCallback) {
          try {
            const data: DeviceRealtimeDataDTO[] = JSON.parse(message.body);
            messageCallback(data);
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
    onWebSocketClose: () => {
      console.log("WebSocket Closed");
    }
  });

  client.activate();
};

export const disconnectWebSocket = () => {
  messageCallback = null; // Stop processing messages immediately
  if (client) {
    console.log("Deactivating WebSocket...");
    client.deactivate();
    client = null;
  }
};
