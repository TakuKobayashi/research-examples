using System;
using System.Collections;
using System.Linq;
using Unity.WebRTC;
using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Thin wrapper around Unity.WebRTC's RTCPeerConnection plus a single data
    /// channel. Owns ICE negotiation and exposes byte-level send/receive events;
    /// application-level (de)serialization is handled one layer up by
    /// PacketRouter / IPayloadCodec. STUN-only configuration: no TURN relay is
    /// used, so a pair where both peers are behind a symmetric NAT may fail to
    /// establish a direct connection - that is an accepted limitation of this
    /// proof of concept, not a bug.
    /// </summary>
    public class WebRtcPeerConnection : IDisposable
    {
        public event Action<RTCIceCandidate> LocalIceCandidateGathered;
        public event Action<RTCPeerConnectionState> ConnectionStateChanged;
        public event Action DataChannelOpened;
        public event Action DataChannelClosed;
        public event Action<byte[]> DataReceived;

        private readonly MonoBehaviour _coroutineRunner;
        private readonly P2PConfig _config;
        private RTCPeerConnection _pc;
        private RTCDataChannel _dataChannel;

        public RTCPeerConnectionState State => _pc?.ConnectionState ?? RTCPeerConnectionState.New;

        public WebRtcPeerConnection(MonoBehaviour coroutineRunner, P2PConfig config)
        {
            _coroutineRunner = coroutineRunner;
            _config = config;
        }

        public void Initialize(bool isInitiator)
        {
            var rtcConfig = new RTCConfiguration
            {
                iceServers = new[] { new RTCIceServer { urls = _config.StunServerUrls } }
            };

            P2PLogger.Info($"[WebRTC] creating RTCPeerConnection isInitiator={isInitiator} " +
                            $"stunServers=[{string.Join(", ", _config.StunServerUrls)}]");
            _pc = new RTCPeerConnection(ref rtcConfig);

            _pc.OnIceCandidate = candidate =>
            {
                P2PLogger.Verbose($"[WebRTC] local ICE candidate gathered: {candidate.Candidate}");
                LocalIceCandidateGathered?.Invoke(candidate);
            };

            _pc.OnIceConnectionChange = state => P2PLogger.Info($"[WebRTC] ICE connection state -> {state}");
            _pc.OnIceGatheringStateChange = state => P2PLogger.Verbose($"[WebRTC] ICE gathering state -> {state}");

            _pc.OnConnectionStateChange = state =>
            {
                P2PLogger.Info($"[WebRTC] peer connection state -> {state}");
                ConnectionStateChanged?.Invoke(state);
            };

            if (isInitiator)
            {
                var init = new RTCDataChannelInit
                {
                    ordered = _config.Reliable,
                    maxRetransmits = _config.Reliable ? (int?)null : _config.MaxRetransmits,
                };
                P2PLogger.Info($"[WebRTC] creating data channel label='{_config.DataChannelLabel}' reliable={_config.Reliable}");
                _dataChannel = _pc.CreateDataChannel(_config.DataChannelLabel, init);
                SetupDataChannel(_dataChannel);
            }
            else
            {
                _pc.OnDataChannel = channel =>
                {
                    P2PLogger.Info($"[WebRTC] received remote data channel label='{channel.Label}'");
                    _dataChannel = channel;
                    SetupDataChannel(_dataChannel);
                };
            }
        }

        private void SetupDataChannel(RTCDataChannel channel)
        {
            channel.OnOpen = () =>
            {
                P2PLogger.Info($"[WebRTC] data channel OPEN label='{channel.Label}'");
                DataChannelOpened?.Invoke();
            };
            channel.OnClose = () =>
            {
                P2PLogger.Info($"[WebRTC] data channel CLOSED label='{channel.Label}'");
                DataChannelClosed?.Invoke();
            };
            channel.OnMessage = bytes =>
            {
                P2PLogger.Verbose($"[WebRTC] data channel received {P2PLogger.ToHexPreview(bytes)}");
                DataReceived?.Invoke(bytes);
            };
        }

        public void CreateOffer(Action<RTCSessionDescription> onOfferCreated) =>
            _coroutineRunner.StartCoroutine(CreateOfferCoroutine(onOfferCreated));

        private IEnumerator CreateOfferCoroutine(Action<RTCSessionDescription> onOfferCreated)
        {
            P2PLogger.Info("[WebRTC] creating offer...");
            var op = _pc.CreateOffer();
            yield return op;
            if (op.IsError)
            {
                P2PLogger.Error($"[WebRTC] CreateOffer failed: {op.Error.message}");
                yield break;
            }
            var desc = op.Desc;
            yield return _coroutineRunner.StartCoroutine(SetLocalDescriptionCoroutine(desc));
            P2PLogger.Info($"[WebRTC] offer created & set as local description ({desc.sdp.Length} chars)");
            onOfferCreated?.Invoke(desc);
        }

        public void CreateAnswer(Action<RTCSessionDescription> onAnswerCreated) =>
            _coroutineRunner.StartCoroutine(CreateAnswerCoroutine(onAnswerCreated));

        private IEnumerator CreateAnswerCoroutine(Action<RTCSessionDescription> onAnswerCreated)
        {
            P2PLogger.Info("[WebRTC] creating answer...");
            var op = _pc.CreateAnswer();
            yield return op;
            if (op.IsError)
            {
                P2PLogger.Error($"[WebRTC] CreateAnswer failed: {op.Error.message}");
                yield break;
            }
            var desc = op.Desc;
            yield return _coroutineRunner.StartCoroutine(SetLocalDescriptionCoroutine(desc));
            P2PLogger.Info($"[WebRTC] answer created & set as local description ({desc.sdp.Length} chars)");
            onAnswerCreated?.Invoke(desc);
        }

        private IEnumerator SetLocalDescriptionCoroutine(RTCSessionDescription desc)
        {
            var op = _pc.SetLocalDescription(ref desc);
            yield return op;
            if (op.IsError)
                P2PLogger.Error($"[WebRTC] SetLocalDescription failed: {op.Error.message}");
        }

        public void SetRemoteDescription(RTCSessionDescription desc) =>
            _coroutineRunner.StartCoroutine(SetRemoteDescriptionCoroutine(desc));

        private IEnumerator SetRemoteDescriptionCoroutine(RTCSessionDescription desc)
        {
            P2PLogger.Info($"[WebRTC] setting remote description type={desc.type}");
            var op = _pc.SetRemoteDescription(ref desc);
            yield return op;
            if (op.IsError)
                P2PLogger.Error($"[WebRTC] SetRemoteDescription failed: {op.Error.message}");
            else
                P2PLogger.Info("[WebRTC] remote description set successfully");
        }

        public void AddRemoteIceCandidate(RTCIceCandidate candidate)
        {
            P2PLogger.Verbose($"[WebRTC] adding remote ICE candidate: {candidate.Candidate}");
            _pc.AddIceCandidate(candidate);
        }

        public void Send(byte[] payload)
        {
            if (_dataChannel == null || _dataChannel.ReadyState != RTCDataChannelState.Open)
            {
                P2PLogger.Warn("[WebRTC] cannot send, data channel not open");
                return;
            }
            P2PLogger.Verbose($"[WebRTC] sending {P2PLogger.ToHexPreview(payload)}");
            _dataChannel.Send(payload);
        }

        public void Dispose()
        {
            P2PLogger.Info("[WebRTC] disposing peer connection");
            _dataChannel?.Close();
            _dataChannel?.Dispose();
            _pc?.Close();
            _pc?.Dispose();
        }
    }
}
