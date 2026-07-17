using System;
using Unity.WebRTC;
using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Singleton entry point for the RealtimeP2PKit library. Orchestrates:
    ///   1. Matchmaking      (IMatchmakingClient  - Hono REST API)
    ///   2. Signaling        (ISignalingClient / LobbyListener - PartyKit WebSocket)
    ///   3. WebRTC negotiation & data channel (WebRtcPeerConnection)
    ///   4. Packet (de)serialization + routing (PacketRouter / MessagePack)
    ///
    /// This is the ONLY class other game code should talk to. Everything else in
    /// this package is an implementation detail reachable through here, which is
    /// what makes the library safe to drop into a different Unity project as-is.
    ///
    /// Typical usage from any other script (see Assets/Scripts/Demo for a full example):
    /// <code>
    ///   P2PManager.Instance.Initialize(config);
    ///   P2PManager.Instance.RegisterPacketHandler&lt;PositionPacket&gt;(1, OnPosition);
    ///   P2PManager.Instance.Matched += info => ...;
    ///   P2PManager.Instance.DataChannelReady += () => ...;
    ///   P2PManager.Instance.StartMatchmaking(myPlayerId);
    ///   ...
    ///   P2PManager.Instance.Send(1, new PositionPacket { X = 1, Y = 0, Z = 3 });
    /// </code>
    /// </summary>
    [DisallowMultipleComponent]
    public class P2PManager : MonoBehaviour
    {
        private static P2PManager _instance;

        /// <summary>Lazily creates a persistent (DontDestroyOnLoad) singleton instance.</summary>
        public static P2PManager Instance
        {
            get
            {
                if (_instance != null) return _instance;
                var go = new GameObject(nameof(P2PManager));
                _instance = go.AddComponent<P2PManager>();
                DontDestroyOnLoad(go);
                P2PLogger.Info("[P2PManager] singleton instance created lazily");
                return _instance;
            }
        }

        public event Action<P2PSessionState> StateChanged;
        public event Action<P2PSessionInfo> Matched;
        public event Action DataChannelReady;
        public event Action<string> ConnectionClosed;

        public P2PSessionInfo Session { get; private set; } = new() { State = P2PSessionState.Idle };

        private P2PConfig _config;
        private IMatchmakingClient _matchmakingClient;
        private LobbyListener _lobbyListener;
        private PartyKitSignalingClient _signalingClient;
        private WebRtcPeerConnection _peerConnection;
        private PacketRouter _packetRouter;
        private bool _webRtcUpdateStarted;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                P2PLogger.Warn("[P2PManager] duplicate instance detected, destroying this one");
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>Must be called once, before any other method on this class.</summary>
        public void Initialize(P2PConfig config)
        {
            _config = config;
            P2PLogger.Level = config.LogLevel;
            P2PLogger.Info($"[P2PManager] initializing. matchmakingApi={config.MatchmakingApiBaseUrl} " +
                            $"partyKitHost={config.PartyKitHost} logLevel={config.LogLevel}");

            _matchmakingClient = new HttpMatchmakingClient(config.MatchmakingApiBaseUrl);
            _packetRouter = new PacketRouter(new MessagePackPayloadCodec());

            if (!_webRtcUpdateStarted)
            {
                StartCoroutine(WebRTC.Update());
                _webRtcUpdateStarted = true;
                P2PLogger.Info("[P2PManager] Unity.WebRTC update loop started");
            }
        }

        /// <summary>Register a typed handler for an application-defined packet id (see PacketRouter).</summary>
        public void RegisterPacketHandler<T>(byte packetId, Action<T> handler) =>
            _packetRouter.Register(packetId, handler);

        public void UnregisterPacketHandler(byte packetId) => _packetRouter.Unregister(packetId);

        /// <summary>Send a MessagePack-encoded packet over the open data channel.</summary>
        public void Send<T>(byte packetId, T value)
        {
            if (Session.State != P2PSessionState.Connected)
            {
                P2PLogger.Warn($"[P2PManager] Send<{typeof(T).Name}> ignored, session state={Session.State}");
                return;
            }
            var buffer = _packetRouter.Encode(packetId, value);
            _peerConnection.Send(buffer);
        }

        /// <summary>Joins the matchmaking queue and drives the connection through to Connected.</summary>
        public async void StartMatchmaking(string localPlayerId)
        {
            SetState(P2PSessionState.Matchmaking);
            Session = new P2PSessionInfo { LocalPlayerId = localPlayerId, State = P2PSessionState.Matchmaking };
            P2PLogger.Info($"[P2PManager] starting matchmaking as playerId={localPlayerId}");

            // Listen on our own lobby room first, in case we end up waiting and get
            // matched later by another player's join request.
            _lobbyListener = new LobbyListener(_config.PartyKitHost, _config.UseSecureWebSocket);
            _lobbyListener.Matched += OnLobbyMatched;
            await _lobbyListener.ConnectAsync(localPlayerId);

            var result = await _matchmakingClient.JoinQueueAsync(localPlayerId);
            if (result.status == "matched")
            {
                OnLobbyMatched(new LobbyMatchedMessage
                {
                    type = "matched",
                    roomId = result.roomId,
                    opponentId = result.opponentId,
                    isInitiator = result.isInitiator,
                });
            }
            else
            {
                P2PLogger.Info("[P2PManager] queued, waiting for an opponent...");
            }
        }

        private async void OnLobbyMatched(LobbyMatchedMessage msg)
        {
            if (Session.State is P2PSessionState.Negotiating or P2PSessionState.Connected)
            {
                P2PLogger.Warn("[P2PManager] OnLobbyMatched fired again, ignoring (already negotiating/connected)");
                return;
            }

            Session.RoomId = msg.roomId;
            Session.OpponentId = msg.opponentId;
            Session.IsInitiator = msg.isInitiator;
            P2PLogger.Info($"[P2PManager] matched. roomId={msg.roomId} opponentId={msg.opponentId} isInitiator={msg.isInitiator}");
            Matched?.Invoke(Session);

            SetState(P2PSessionState.SignalingConnecting);
            _signalingClient = new PartyKitSignalingClient(_config.PartyKitHost, _config.UseSecureWebSocket);
            _signalingClient.MessageReceived += OnSignalMessage;
            _signalingClient.Connected += OnSignalingConnected;
            _signalingClient.Disconnected += reason => P2PLogger.Warn($"[P2PManager] signaling disconnected: {reason}");
            await _signalingClient.ConnectAsync(msg.roomId);
        }

        private void OnSignalingConnected()
        {
            SetState(P2PSessionState.Negotiating);
            P2PLogger.Info($"[P2PManager] signaling connected, starting WebRTC negotiation (isInitiator={Session.IsInitiator})");

            _peerConnection = new WebRtcPeerConnection(this, _config);
            _peerConnection.Initialize(Session.IsInitiator);

            _peerConnection.LocalIceCandidateGathered += candidate => _signalingClient.Send(new RoomSignalEnvelope
            {
                type = "ice-candidate",
                candidate = candidate.Candidate,
                sdpMid = candidate.SdpMid,
                sdpMLineIndex = candidate.SdpMLineIndex,
            });

            _peerConnection.ConnectionStateChanged += state =>
            {
                if (state is RTCPeerConnectionState.Failed or RTCPeerConnectionState.Disconnected or RTCPeerConnectionState.Closed)
                {
                    SetState(P2PSessionState.Disconnected);
                    ConnectionClosed?.Invoke(state.ToString());
                }
            };

            _peerConnection.DataChannelOpened += () =>
            {
                SetState(P2PSessionState.Connected);
                DataChannelReady?.Invoke();
            };
            _peerConnection.DataChannelClosed += () =>
            {
                SetState(P2PSessionState.Disconnected);
                ConnectionClosed?.Invoke("data channel closed");
            };
            _peerConnection.DataReceived += bytes => _packetRouter.Dispatch(bytes);

            if (Session.IsInitiator)
            {
                _peerConnection.CreateOffer(offer =>
                    _signalingClient.Send(new RoomSignalEnvelope { type = "offer", sdp = offer.sdp }));
            }
        }

        private void OnSignalMessage(RoomSignalEnvelope msg)
        {
            switch (msg.type)
            {
                case "offer":
                    P2PLogger.Info("[P2PManager] received offer, setting remote description and creating answer");
                    _peerConnection.SetRemoteDescription(new RTCSessionDescription { type = RTCSdpType.Offer, sdp = msg.sdp });
                    _peerConnection.CreateAnswer(answer =>
                        _signalingClient.Send(new RoomSignalEnvelope { type = "answer", sdp = answer.sdp }));
                    break;

                case "answer":
                    P2PLogger.Info("[P2PManager] received answer, setting remote description");
                    _peerConnection.SetRemoteDescription(new RTCSessionDescription { type = RTCSdpType.Answer, sdp = msg.sdp });
                    break;

                case "ice-candidate":
                    var init = new RTCIceCandidateInit
                    {
                        candidate = msg.candidate,
                        sdpMid = msg.sdpMid,
                        sdpMLineIndex = msg.sdpMLineIndex,
                    };
                    _peerConnection.AddRemoteIceCandidate(new RTCIceCandidate(init));
                    break;

                case "peer-left":
                    P2PLogger.Warn("[P2PManager] opponent left the room");
                    SetState(P2PSessionState.Disconnected);
                    ConnectionClosed?.Invoke("peer-left");
                    break;

                default:
                    P2PLogger.Verbose($"[P2PManager] unhandled signal type={msg.type}");
                    break;
            }
        }

        private void Update()
        {
            _signalingClient?.DispatchMessageQueue();
            _lobbyListener?.DispatchMessageQueue();
        }

        private void SetState(P2PSessionState state)
        {
            if (Session.State == state) return;
            P2PLogger.Info($"[P2PManager] state {Session.State} -> {state}");
            Session.State = state;
            StateChanged?.Invoke(state);
        }

        /// <summary>Tears down the current session and leaves the matchmaking queue if still waiting.</summary>
        public async void Disconnect()
        {
            P2PLogger.Info("[P2PManager] disconnect requested");
            if (_matchmakingClient != null && Session.LocalPlayerId != null)
                await _matchmakingClient.LeaveQueueAsync(Session.LocalPlayerId);

            _peerConnection?.Dispose();
            _signalingClient?.Dispose();
            _lobbyListener?.Dispose();
            SetState(P2PSessionState.Idle);
        }

        private void OnDestroy()
        {
            _peerConnection?.Dispose();
            _signalingClient?.Dispose();
            _lobbyListener?.Dispose();
        }
    }
}
