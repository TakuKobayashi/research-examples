using MessagePack;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Codec backed by MessagePack-CSharp (github.com/MessagePack-CSharp/MessagePack-CSharp),
    /// installed via NuGet. Payload types should be marked [MessagePackObject] with
    /// [Key(n)] attributes on each field/property for the smallest, AOT-friendly wire format.
    /// NOTE (IL2CPP): MessagePack's default resolver uses runtime code generation, which does
    /// not work under IL2CPP/AOT. For device builds, run the `mpc` (MessagePack Code Generator)
    /// tool to pre-generate formatters and pass a resolver that includes the generated
    /// `GeneratedResolver` here. See README.md in this package for the exact command.
    /// </summary>
    public class MessagePackPayloadCodec : IPayloadCodec
    {
        private readonly MessagePackSerializerOptions _options;

        public MessagePackPayloadCodec(MessagePackSerializerOptions options = null)
        {
            _options = options ?? MessagePackSerializerOptions.Standard;
        }

        public byte[] Serialize<T>(T value)
        {
            var bytes = MessagePackSerializer.Serialize(value, _options);
            P2PLogger.Verbose($"[Codec] serialized {typeof(T).Name} -> {P2PLogger.ToHexPreview(bytes)}");
            return bytes;
        }

        public T Deserialize<T>(byte[] bytes)
        {
            var value = MessagePackSerializer.Deserialize<T>(bytes, _options);
            P2PLogger.Verbose($"[Codec] deserialized {P2PLogger.ToHexPreview(bytes)} -> {typeof(T).Name}: {value}");
            return value;
        }
    }
}
