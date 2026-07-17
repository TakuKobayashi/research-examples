using System;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine.Networking;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Matchmaking client for the Hono-based "matching-api" worker
    /// (see /server/apps/matching-api). Endpoints:
    ///   POST {baseUrl}/api/matchmaking/join  { playerId } -> MatchmakingResult
    ///   POST {baseUrl}/api/matchmaking/leave { playerId }
    /// </summary>
    public class HttpMatchmakingClient : IMatchmakingClient
    {
        private readonly string _baseUrl;

        public HttpMatchmakingClient(string baseUrl)
        {
            _baseUrl = baseUrl.TrimEnd('/');
        }

        public async Task<MatchmakingResult> JoinQueueAsync(string playerId)
        {
            var url = $"{_baseUrl}/api/matchmaking/join";
            var body = JsonConvert.SerializeObject(new MatchmakingJoinRequest { playerId = playerId });
            P2PLogger.Info($"[Matchmaking] POST {url} body={body}");

            var responseText = await PostJsonAsync(url, body);
            P2PLogger.Verbose($"[Matchmaking] response={responseText}");

            var result = JsonConvert.DeserializeObject<MatchmakingResult>(responseText);
            P2PLogger.Info($"[Matchmaking] status={result.status} roomId={result.roomId} " +
                            $"opponentId={result.opponentId} isInitiator={result.isInitiator}");
            return result;
        }

        public async Task LeaveQueueAsync(string playerId)
        {
            var url = $"{_baseUrl}/api/matchmaking/leave";
            var body = JsonConvert.SerializeObject(new MatchmakingJoinRequest { playerId = playerId });
            P2PLogger.Info($"[Matchmaking] POST {url} (leave)");
            try
            {
                await PostJsonAsync(url, body);
                P2PLogger.Info("[Matchmaking] left queue");
            }
            catch (Exception ex)
            {
                P2PLogger.Warn($"[Matchmaking] leave failed (ignored): {ex.Message}");
            }
        }

        private static async Task<string> PostJsonAsync(string url, string jsonBody)
        {
            using var req = new UnityWebRequest(url, "POST");
            var bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");

            var op = req.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (req.result != UnityWebRequest.Result.Success)
            {
                P2PLogger.Error($"[Matchmaking] request failed: {req.error} (HTTP {req.responseCode}) url={url}");
                throw new Exception($"Matchmaking request failed: {req.error}");
            }

            return req.downloadHandler.text;
        }
    }
}
