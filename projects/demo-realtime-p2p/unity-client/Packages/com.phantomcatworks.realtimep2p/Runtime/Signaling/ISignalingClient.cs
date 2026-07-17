using System;
using System.Threading.Tasks;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Abstraction over the signaling transport used to exchange SDP offer/answer
    /// and ICE candidates before the WebRTC data channel is established. Swappable
    /// so a different signaling backend can be used without touching P2PManager.
    /// </summary>
    public interface ISignalingClient : IDisposable
    {
        event Action Connected;
        event Action<string> Disconnected;
        event Action<RoomSignalEnvelope> MessageReceived;

        Task ConnectAsync(string roomId);
        void Send(RoomSignalEnvelope message);
        void DispatchMessageQueue();
    }
}
