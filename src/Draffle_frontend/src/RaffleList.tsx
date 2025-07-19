import "./RaffleList.scss";
import { useEffect, useState } from "react";
import { RaffleDetail } from "../../declarations/Draffle_backend/Draffle_backend.did";
import { useNavigate } from "react-router-dom";
import { Draffle_backend } from "../../declarations/Draffle_backend";

function RaffleList() {
  const [raffles, setRaffles] = useState<RaffleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const navigate = useNavigate();

  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const result = await Draffle_backend.getAllRaffles();
      const sortedRaffles = [...result].sort(
        (a, b) => Number(b.startTime) - Number(a.startTime)
      );
      setRaffles(sortedRaffles);
    } catch (error) {
      console.error("Error fetching raffles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  const filteredRaffles = raffles.filter(raffle => {
    if (filter === 'active') return !raffle.raffleCompleted;
    if (filter === 'completed') return raffle.raffleCompleted;
    return true;
  });

  const formatTime = (time: bigint) => {
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleString();
  };

  const getStatusBadge = (raffle: RaffleDetail) => {
    const now = Date.now() * 1000000;
    const isActive = !raffle.raffleCompleted && Number(raffle.endTime) > now;
    const isCompleted = raffle.raffleCompleted;
    
    if (isCompleted) {
      return <span className="status-badge completed">🏆 Completed</span>;
    } else if (isActive) {
      return <span className="status-badge active">🔥 Active</span>;
    } else {
      return <span className="status-badge expired">⏰ Expired</span>;
    }
  };

  if (loading) {
    return (
      <div className="raffle-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading raffles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="raffle-list">
      <div className="list-header">
        <h2>🎪 All Raffles</h2>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({raffles.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({raffles.filter(r => !r.raffleCompleted).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({raffles.filter(r => r.raffleCompleted).length})
          </button>
        </div>
      </div>

      {filteredRaffles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No raffles found</h3>
          <p>
            {filter === 'all' 
              ? "Be the first to create a raffle!"
              : `No ${filter} raffles available.`
            }
          </p>
        </div>
      ) : (
        <div className="raffles-grid">
          {filteredRaffles.map((raffle) => (
            <div
              key={raffle.id.toString()}
              className="raffle-card"
              onClick={() => navigate(`/raffle/${raffle.id.toString()}`)}
            >
              <div className="card-header">
                <h3 className="raffle-title">{raffle.title}</h3>
                {getStatusBadge(raffle)}
              </div>
              
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">💰 Prize Pool</span>
                  <span className="stat-value">{raffle.prizePool.toString()} ICP</span>
                </div>
                <div className="stat">
                  <span className="stat-label">🎫 Entries</span>
                  <span className="stat-value">{raffle.noOfEntries.toString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">👥 Participants</span>
                  <span className="stat-value">{raffle.numberOfParticipants.toString()}</span>
                </div>
              </div>

              <div className="card-timing">
                <div className="time-info">
                  <span className="time-label">Started:</span>
                  <span className="time-value">{formatTime(raffle.startTime)}</span>
                </div>
                <div className="time-info">
                  <span className="time-label">Ends:</span>
                  <span className="time-value">{formatTime(raffle.endTime)}</span>
                </div>
              </div>

              {raffle.winner && (
                <div className="winner-info">
                  <span className="winner-label">🏆 Winner:</span>
                  <span className="winner-address">
                    {raffle.winner.toString().slice(0, 8)}...
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RaffleList;