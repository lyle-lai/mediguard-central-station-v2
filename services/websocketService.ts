import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { DeviceRealtimeDataDTO } from '../types';

// WebSocket 端点配置
// 后端配置: context-path=/api, STOMP endpoint=/ws-mediguard with SockJS
const SOCKET_URL = 'http://localhost:8080/api/ws-mediguard';
const TOPIC_VITALS = '/topic/vitals';

let client: Client | null = null;
let messageCallback: ((data: DeviceRealtimeDataDTO[]) => void) | null = null;

export const connectWebSocket = (onMessage: (data: DeviceRealtimeDataDTO[]) => void) => {
  // Update callback reference immediately
  messageCallback = onMessage;

  if (client && client.active) {
    console.log("✅ WebSocket已激活，更新回调");
    return;
  }

  if (client) {
    // 清理旧连接
    try { client.deactivate(); } catch (e) { }
  }

  console.log("🔄 初始化SockJS+STOMP客户端...");

  client = new Client({
    // 使用SockJS作为WebSocket传输层
    webSocketFactory: () => new SockJS(SOCKET_URL) as any,

    debug: (str) => {
      console.log('📡 [STOMP Debug]', str);
    },

    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: () => {
      console.log('✅ WebSocket已连接');

      client?.subscribe(TOPIC_VITALS, (message) => {
        if (message.body && messageCallback) {
          try {
            const data: DeviceRealtimeDataDTO[] = JSON.parse(message.body);
            console.log('📥 [WebSocket] 接收数据:', data.length, '个设备');
            messageCallback(data);
          } catch (e) {
            console.error('❌ [WebSocket] 解析消息失败:', e);
          }
        }
      });
    },

    onStompError: (frame) => {
      console.error('❌ STOMP错误:', frame.headers['message']);
      console.error('详细信息:', frame.body);
    },

    onWebSocketClose: () => {
      console.log('🔌 WebSocket已关闭');
    },

    onWebSocketError: (error) => {
      console.error('❌ WebSocket错误:', error);
    }
  });

  client.activate();
  console.log('🚀 STOMP客户端已激活');
};

export const disconnectWebSocket = () => {
  messageCallback = null;
  if (client) {
    console.log("🔌 断开WebSocket连接...");
    client.deactivate();
    client = null;
  }
};
