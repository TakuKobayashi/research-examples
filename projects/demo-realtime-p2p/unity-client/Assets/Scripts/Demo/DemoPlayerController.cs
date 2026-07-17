using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit.Demo
{
    /// <summary>
    /// Drives the local player's cube with WASD/arrow input and pushes its
    /// position to the opponent over the P2P data channel at a fixed rate.
    /// Note this script only ever talks to P2PManager.Instance - it never touches
    /// WebRTC, PartyKit or MessagePack directly, which is the point of the library.
    /// </summary>
    public class DemoPlayerController : MonoBehaviour
    {
        public const byte PositionPacketId = 1;

        [SerializeField] private float _moveSpeed = 4f;
        [SerializeField] private float _sendIntervalSeconds = 0.05f; // ~20Hz

        private float _sendTimer;

        private void Update()
        {
            var input = new Vector3(Input.GetAxis("Horizontal"), 0f, Input.GetAxis("Vertical"));
            transform.position += input * (_moveSpeed * Time.deltaTime);

            _sendTimer += Time.deltaTime;
            if (_sendTimer < _sendIntervalSeconds) return;
            _sendTimer = 0f;

            var packet = new PositionPacket
            {
                X = transform.position.x,
                Y = transform.position.y,
                Z = transform.position.z,
                TimestampMs = Time.realtimeSinceStartup * 1000f,
            };
            P2PManager.Instance.Send(PositionPacketId, packet);
        }
    }
}
