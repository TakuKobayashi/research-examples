using System;
using System.Collections.Generic;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Routes incoming byte[] data-channel payloads to typed handlers based on a
    /// 1-byte packet-id prefix, and prefixes outgoing payloads the same way.
    /// This lets one game (or several different games reusing this library) share
    /// a single WebRTC data channel for multiple packet types.
    /// Wire format: [1 byte packetId][MessagePack-encoded body].
    /// </summary>
    public class PacketRouter
    {
        private readonly IPayloadCodec _codec;
        private readonly Dictionary<byte, Action<byte[]>> _handlers = new();

        public PacketRouter(IPayloadCodec codec)
        {
            _codec = codec;
        }

        public void Register<T>(byte packetId, Action<T> handler)
        {
            _handlers[packetId] = raw => handler(_codec.Deserialize<T>(raw));
            P2PLogger.Info($"[PacketRouter] registered handler packetId={packetId} type={typeof(T).Name}");
        }

        public void Unregister(byte packetId)
        {
            _handlers.Remove(packetId);
            P2PLogger.Info($"[PacketRouter] unregistered handler packetId={packetId}");
        }

        public byte[] Encode<T>(byte packetId, T value)
        {
            var body = _codec.Serialize(value);
            var buffer = new byte[body.Length + 1];
            buffer[0] = packetId;
            Buffer.BlockCopy(body, 0, buffer, 1, body.Length);
            return buffer;
        }

        public void Dispatch(byte[] raw)
        {
            if (raw == null || raw.Length < 1)
            {
                P2PLogger.Warn("[PacketRouter] received empty/invalid packet, dropping");
                return;
            }

            var packetId = raw[0];
            var body = new byte[raw.Length - 1];
            Buffer.BlockCopy(raw, 1, body, 0, body.Length);

            if (_handlers.TryGetValue(packetId, out var handler))
            {
                handler(body);
            }
            else
            {
                P2PLogger.Warn($"[PacketRouter] no handler registered for packetId={packetId}, dropping {body.Length} bytes");
            }
        }
    }
}
