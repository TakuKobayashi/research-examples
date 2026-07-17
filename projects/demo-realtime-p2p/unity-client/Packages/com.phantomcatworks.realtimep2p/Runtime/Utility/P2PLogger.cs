using System;
using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit
{
    public enum P2PLogLevel
    {
        None = 0,
        Error = 1,
        Warn = 2,
        Info = 3,
        Verbose = 4,
    }

    /// <summary>
    /// Centralized logging for RealtimeP2PKit.
    /// Info level logs every step of matchmaking / signaling / WebRTC negotiation
    /// (state transitions, connect/disconnect, offer/answer/ICE exchange).
    /// Verbose level additionally logs the raw content of every message sent and
    /// received (SDP text, ICE candidate strings, MessagePack payload bytes),
    /// which is intended for debugging the connection flow during development.
    /// Turn Verbose off (use Info or lower) for production builds.
    /// </summary>
    public static class P2PLogger
    {
        public static P2PLogLevel Level = P2PLogLevel.Info;
        private const string Tag = "[RealtimeP2PKit]";

        public static void Error(string message) => Log(P2PLogLevel.Error, message, LogType.Error);
        public static void Warn(string message) => Log(P2PLogLevel.Warn, message, LogType.Warning);
        public static void Info(string message) => Log(P2PLogLevel.Info, message, LogType.Log);
        public static void Verbose(string message) => Log(P2PLogLevel.Verbose, message, LogType.Log);

        public static void Exception(Exception ex, string context = null)
        {
            if (Level < P2PLogLevel.Error) return;
            Debug.LogError($"{Tag} {(context != null ? $"[{context}] " : "")}Exception: {ex}");
        }

        private static void Log(P2PLogLevel level, string message, LogType logType)
        {
            if (Level < level) return;
            var line = $"{Tag}[{DateTime.Now:HH:mm:ss.fff}][{level}] {message}";
            switch (logType)
            {
                case LogType.Error:
                    Debug.LogError(line);
                    break;
                case LogType.Warning:
                    Debug.LogWarning(line);
                    break;
                default:
                    Debug.Log(line);
                    break;
            }
        }

        /// <summary>Hex preview of a byte payload, truncated, for verbose data-channel tracing.</summary>
        public static string ToHexPreview(byte[] bytes, int maxLen = 64)
        {
            if (bytes == null) return "null";
            var len = Math.Min(bytes.Length, maxLen);
            var hex = BitConverter.ToString(bytes, 0, len).Replace("-", " ");
            return bytes.Length > maxLen ? $"{hex} ...({bytes.Length} bytes total)" : $"{hex} ({bytes.Length} bytes)";
        }
    }
}
