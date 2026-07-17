namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Pluggable codec for application payloads sent over the WebRTC data channel.
    /// Default implementation is MessagePack-CSharp (see MessagePackPayloadCodec),
    /// but any other binary format can be swapped in by implementing this interface.
    /// </summary>
    public interface IPayloadCodec
    {
        byte[] Serialize<T>(T value);
        T Deserialize<T>(byte[] bytes);
    }
}
