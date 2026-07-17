using System.Threading.Tasks;

namespace PhantomCatWorks.RealtimeP2PKit
{
    /// <summary>
    /// Abstraction over the matchmaking backend, so a different REST API (or a
    /// completely different matchmaking strategy) can be swapped in without
    /// touching P2PManager or any other part of the library.
    /// </summary>
    public interface IMatchmakingClient
    {
        Task<MatchmakingResult> JoinQueueAsync(string playerId);
        Task LeaveQueueAsync(string playerId);
    }
}
