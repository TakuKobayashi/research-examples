namespace PhantomCatWorks.RealtimeP2PKit
{
    public enum P2PSessionState
    {
        Idle,
        Matchmaking,
        SignalingConnecting,
        Negotiating,
        Connected,
        Disconnected,
        Failed,
    }

    /// <summary>Mutable state for the current (or most recent) P2P session.</summary>
    public class P2PSessionInfo
    {
        public string LocalPlayerId;
        public string OpponentId;
        public string RoomId;
        public bool IsInitiator;
        public P2PSessionState State;
    }
}
