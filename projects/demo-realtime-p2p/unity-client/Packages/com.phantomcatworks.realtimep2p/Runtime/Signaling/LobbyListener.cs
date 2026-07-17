using System;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NativeWebSocket;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Listens on this player's PartyKit "lobby" party (a per-player room, keyed by
    /// playerId) for a push notification that a match was found while this player
    /// was waiting in the matchmaking queue.
    /// See /server/apps/signaling-party/party/lobby.ts and
    /// /server/apps/matching-api/src/routes/matchmaking.ts (the fetch() push).
    /// </summary>
    public class LobbyListener : IDisposable
    {
        public event Action<LobbyMatchedMessage> Matched;

        private readonly string _host;
        private readonly bool _secure;
        private WebSocket _ws;

        public LobbyListener(string host, bool secure = true)
        {
            _host = host;
            _secure = secure;
        }

        public async Task ConnectAsync(string playerId)
        {
            var scheme = _secure ? "wss" : "ws";
            var url = $"{scheme}://{_host}/parties/lobby/{playerId}";
            P2PLogger.Info($"[Lobby] connecting: {url}");

            _ws = new WebSocket(url);
            _ws.OnOpen += () => P2PLogger.Info("[Lobby] websocket OPEN, waiting for match...");
            _ws.OnError += err => P2PLogger.Error($"[Lobby] websocket error: {err}");
            _ws.OnClose += code => P2PLogger.Info($"[Lobby] websocket closed code={code}");
            _ws.OnMessage += bytes =>
            {
                var json = Encoding.UTF8.GetString(bytes);
                P2PLogger.Verbose($"[Lobby] <= {json}");
                try
                {
                    var msg = JsonConvert.DeserializeObject<LobbyMatchedMessage>(json);
                    if (msg?.type == "matched")
                    {
                        P2PLogger.Info($"[Lobby] matched! roomId={msg.roomId} opponentId={msg.opponentId} isInitiator={msg.isInitiator}");
                        Matched?.Invoke(msg);
                    }
                }
                catch (Exception ex)
                {
                    P2PLogger.Exception(ex, "Lobby.OnMessage.Parse");
                }
            };

            await _ws.Connect();
        }

        public void DispatchMessageQueue()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            _ws?.DispatchMessageQueue();
#endif
        }

        public void Dispose() => _ws?.Close();
    }
}
