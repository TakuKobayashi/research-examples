using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit.Demo
{
    /// <summary>
    /// Receives the opponent's PositionPacket via P2PManager and smoothly moves
    /// a proxy cube toward it. Registered as the handler for PositionPacketId.
    /// </summary>
    public class DemoRemotePlayerSync : MonoBehaviour
    {
        [SerializeField] private float _lerpSpeed = 12f;

        private Vector3 _targetPosition;
        private bool _hasTarget;

        private void OnEnable()
        {
            P2PManager.Instance.RegisterPacketHandler<PositionPacket>(
                DemoPlayerController.PositionPacketId, OnPositionReceived);
        }

        private void OnDisable()
        {
            P2PManager.Instance.UnregisterPacketHandler(DemoPlayerController.PositionPacketId);
        }

        private void OnPositionReceived(PositionPacket packet)
        {
            _targetPosition = new Vector3(packet.X, packet.Y, packet.Z);
            _hasTarget = true;
            Debug.Log($"[Demo] remote position received: {packet}");
        }

        private void Update()
        {
            if (!_hasTarget) return;
            transform.position = Vector3.Lerp(transform.position, _targetPosition, Time.deltaTime * _lerpSpeed);
        }
    }
}
