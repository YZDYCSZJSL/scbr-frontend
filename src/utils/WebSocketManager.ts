/**
 * 课堂行为分析 - 实时流 WebSocket 客户端
 * 实现了标准的心跳检测、断线重连以及事件分发机制。
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string = '';

  // 状态变量
  public isConnected: boolean = false;
  private isIntentionalClose: boolean = false; // 是否为主动关闭（主动释放资源不触发重连）

  // 重连与心跳参数
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly heartbeatInterval: number = 30000; // 30秒发送一次 ping
  private readonly maxMissedPongs: number = 3;        // 连续 3 次没收到 pong 即视为断线

  private missedPongCount: number = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 生命周期回调，暴露给业务层 / 组件层使用
  public onMessage?: (data: any) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: Event) => void;

  /**
   * @param domain 传入类似 '127.0.0.1:8080' 或 'app.domain.com'
   * @param scheduleId 排课记录 ID
   * @param token 授权令牌
   */
  constructor(
    private domain: string,
    private scheduleId: string | number,
    private token: string
  ) {
    this.url = this.buildUrl();
  }

  /**
   * 拼接标准 WebSocket 路径
   */
  private buildUrl(): string {
    // 假设 domain 会带有 ws:// 或 wss:// 头，如果没有则默认加上 ws://（生产环境需要考虑 wss://）
    const protocol = this.domain.startsWith('ws') ? '' : 'ws://';
    return `${protocol}${this.domain}/ws/v1/analysis/stream/${this.scheduleId}?token=${this.token}`;
  }

  /**
   * 建立连接
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.warn('【WebSocket】连接已经在建立或已连接，跳过重复的 connect() 调用。');
      return;
    }

    // 每次重新建立连接前，重置主动关闭标记
    this.isIntentionalClose = false;
    this.ws = new WebSocket(this.url);
    this.bindEvents();
  }

  /**
   * 绑定原生事件
   */
  private bindEvents(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('【WebSocket】连接建立成功', this.url);
      this.isConnected = true;
      this.reconnectAttempts = 0; // 建立成功后重置重连尝试次数
      this.onConnected?.();

      // 开启心跳任务
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // 捕获心跳响应，拦截掉不抛给业务层
        if (data.type === 'pong') {
          this.missedPongCount = 0; // 收到心跳响应，清零丢失计数
          return;
        }

        // 其它业务消息交由外层处理 (如 AI 识别返回的 bounding_boxes)
        if (this.onMessage) {
          this.onMessage(data);
        }
      } catch (e) {
        console.error('【WebSocket】消息解析失败', event.data, e);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`【WebSocket】连接关闭 (code: ${event.code}, reason: ${event.reason})`);
      this.handleDisconnect();
    };

    this.ws.onerror = (error: Event) => {
      console.error('【WebSocket】连接发生异常错误', error);
      this.onError?.(error);
      // 原生 websocket 触发 error 后也会随即触发 close 事件，重连由 close 统一负责。
    };
  }

  /**
   * 开启心跳检测
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.missedPongCount = 0;

    // 每 30 秒执行一次向后端发 ping
    this.heartbeatTimer = setInterval(() => {
      // 连续 3 次没收到 pong（90秒）认为已经假死
      if (this.missedPongCount >= this.maxMissedPongs) {
        console.warn(`【WebSocket】心跳检测超时 (${this.heartbeatInterval * this.maxMissedPongs}ms 无响应)，准备强制断线重连...`);
        this.ws?.close(); // 这里通过主动 close，来引导 onclose 触发，进而走重连流程
        return;
      }

      this.missedPongCount++;
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingMsg = {
          type: 'ping',
          timestamp: Date.now()
        };
        this.ws.send(JSON.stringify(pingMsg));
      }
    }, this.heartbeatInterval);
  }

  /**
   * 清除心跳定时器
   */
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 处理断线或主动断开
   */
  private handleDisconnect(): void {
    this.isConnected = false;
    this.clearHeartbeat();
    this.onDisconnected?.();

    if (this.isIntentionalClose) {
      console.log('【WebSocket】生命周期已完成 / 主动离开，防抖重连机制在此关闭。');
      return;
    }

    // 非主动关闭 -> 触发断线重连
    this.attemptReconnect();
  }

  /**
   * 阶梯延迟尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('【WebSocket】已经达到最大重连次数(5)，已完全放弃重连。');
      return;
    }

    this.reconnectAttempts++;

    // 固定的阶梯延迟：3s, 5s, 10s, 15s, 30s
    const delays = [3000, 5000, 10000, 15000, 30000];
    const delay = delays[this.reconnectAttempts - 1] || 30000;

    console.log(`【WebSocket】正在尝试第 ${this.reconnectAttempts} 次重连，延迟延后 ${delay} 毫秒执行...`);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 发送业务消息（供 Vue 等上层组件调用发送 base64 图像等数据）
   */
  public send(data: string | object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('【WebSocket】连接状态异常，消息发送失败。');
      return;
    }
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
  }

  /**
   * 明确的主动销毁方法：防止内存泄漏
   * 应该在组件 `onUnmounted` 或用户点击“结束识别”按钮时调用此函数。
   */
  public close(): void {
    this.isIntentionalClose = true;

    // 清除所有的定时器
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 断开底层连接
    if (this.ws) {
      // 规范可传 code 表明是正常关闭，1000 代表 normal closure
      this.ws.close(1000, 'User intentionally closed connection.');
      this.ws = null;
    }

    this.isConnected = false;
    console.log('【WebSocket】客户端实例已安全销毁');
  }
}
