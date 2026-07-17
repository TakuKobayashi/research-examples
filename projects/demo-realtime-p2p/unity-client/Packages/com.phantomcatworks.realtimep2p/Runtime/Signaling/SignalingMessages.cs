using System;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>Message pushed from the lobby PartyKit room when a match is found.</summary>
    [Serializable]
    public class LobbyMatchedMessage
    {
        public string type; // "matched"
        public string roomId;
        public string opponentId;
        public bool isInitiator;
    }

    /// <summary>Envelope for messages relayed inside a PartyKit game room (SDP/ICE).</summary>
    [Serializable]
    public class RoomSignalEnvelope
    {
        public string type; // "offer" | "answer" | "ice-candidate" | "peer-count" | "peer-left"
        public string sdp;
        public string candidate;
        public string sdpMid;
        public int? sdpMLineIndex;
        public int? count;
    }
}
