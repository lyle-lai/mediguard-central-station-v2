
import { Client } from '@stomp/stompjs';
import { DeviceRealtimeDataDTO } from '../types';

const SOCKET_URL = 'ws://localhost:8080/ws-mediguard';
const TOPIC_VITALS = '/topic/vitals';

let client: Client | null = null;

export const connectWebSocket = (onMessage: (data: DeviceRealtimeDataDTO[]) => void) => {
  if (client && client.active) return;

  client = new Client({
    brokerURL: SOCKET_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket Connected');
      client?.subscribe(TOPIC_VITALS, (message) => {
        if (message.body) {
          const data: DeviceRealtimeDataDTO[] = JSON.parse(message.body);
          onMessage(data);
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  client.activate();
};

export const disconnectWebSocket = () => {
  if (client) {
    client.deactivate();
    client = null;
    console.log('WebSocket Disconnected');
  }
};
