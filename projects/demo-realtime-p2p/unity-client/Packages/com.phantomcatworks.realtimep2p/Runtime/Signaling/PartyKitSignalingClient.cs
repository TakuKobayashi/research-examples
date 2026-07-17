using System;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NativeWebSocket;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Signaling client for a PartyKit "room" party (see
    /// /server/apps/signaling-party/party/room.ts). Relays WebRTC offer/answer/ICE
    /// candidates between exactly two peers in a 1:1 room.
    /// Uses NativeWebSocket (github.com/endel/NativeWebSocket) for a cross-platform
    /// (Editor/Standalone/Mobile/WebGL) WebSocket implementation.
    /// </summary>
    public class PartyKitSignalingClient : ISignalingClient
    {
        public event Action Connected;
        public event Action<string> Disconnected;
        public event Action<RoomSignalEnvelope> MessageReceived;

        private readonly string _host;
        private readonly bool _secure;
        private WebSocket _ws;

        public PartyKitSignalingClient(string host, bool secure = true)
        {
            _host = host;
            _secure = secure;
        }

        public async Task ConnectAsync(string roomId)
        {
            var scheme = _secure ? "wss" : "ws";
            var url = $"{scheme}://{_host}/party/{roomId}";
            P2PLogger.Info($"[Signaling] connecting to room websocket: {url}");

            _ws = new WebSocket(url);

            _ws.OnOpen += () =>
            {
                P2PLogger.Info("[Signaling] websocket OPEN");
                Connected?.Invoke();
            };

            _ws.OnError += err => P2PLogger.Error($"[Signaling] websocket error: {err}");

            _ws.OnClose += code =>
            {
                P2PLogger.Warn($"[Signaling] websocket CLOSED code={code}");
                Disconnected?.Invoke(code.ToString());
            };

            _ws.OnMessage += bytes =>
            {
                var json = Encoding.UTF8.GetString(bytes);
                P2PLogger.Verbose($"[Signaling] <= {json}");
                try
                {
                    var envelope = JsonConvert.DeserializeObject<RoomSignalEnvelope>(json);
                    MessageReceived?.Invoke(envelope);
                }
                catch (Exception ex)
                {
                    P2PLogger.Exception(ex, "Signaling.OnMessage.Parse");
                }
            };

            await _ws.Connect();
        }

        public void Send(RoomSignalEnvelope message)
        {
            if (_ws == null || _ws.State != WebSocketState.Open)
            {
                P2PLogger.Warn($"[Signaling] cannot send, socket not open (type={message.type})");
                return;
            }
            var json = JsonConvert.SerializeObject(message);
            P2PLogger.Verbose($"[Signaling] => {json}");
            _ = _ws.SendText(json);
        }

        /// <summary>Must be pumped every frame from a MonoBehaviour Update() on non-WebGL platforms.</summary>
        public void DispatchMessageQueue()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            _ws?.DispatchMessageQueue();
#endif
        }

        public void Dispose() => _ws?.Close();
    }
}
