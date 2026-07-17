using MessagePack;

namespace PhantomCatWorks.RealtimeP2PKit.Demo
{
    /// <summary>
    /// Example application-level packet: this demo simply syncs each player's
    /// world-space position every tick over the WebRTC data channel via
    /// P2PManager.Send/RegisterPacketHandler. This type lives in the demo project,
    /// NOT in the RealtimeP2PKit package, because packet contents are game-specific -
    /// the library itself never assumes anything about what you send over it.
    /// </summary>
    [MessagePackObject]
    public struct PositionPacket
    {
        [Key(0)] public float X;
        [Key(1)] public float Y;
        [Key(2)] public float Z;
        [Key(3)] public float TimestampMs;

        public override string ToString() => $"({X:F2}, {Y:F2}, {Z:F2}) t={TimestampMs:F0}ms";
    }
}
