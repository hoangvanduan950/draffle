import "./Account.scss";
import { useEffect, useState } from "react";
import { tokenBalance, tokenSymbol } from "./utils/icrc2Ledger";
import { useAuth } from "./use-auth-client";
import { Draffle_backend } from "../../declarations/Draffle_backend";
import { RaffleDetail } from "../../declarations/Draffle_backend/Draffle_backend.did";
import { useNavigate } from "react-router-dom";

function Account() {
  const [token, setToken] = useState<string>("");
  const [balance, setBalance] = useState<bigint>(0n);
  const [userRaffles, setUserRaffles] = useState<RaffleDetail[]>([]);
  const [participatedRaffles, setParticipatedRaffles] = useState<RaffleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'created' | 'participated'>('overview');

  const { principal, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    tokenSymbol().then(setToken);
  }, []);

  useEffect(() => {
    if (!principal) {
      return;
    }
    tokenBalance(principal).then(setBalance);
  }, [principal]);

  useEffect(() => {
    if (!isAuthenticated || !principal) {
      setLoading(false);
      return;
    }
    
    fetchUserRaffles();
  }, [isAuthenticated, principal]);

  const fetchUserRaffles = async () => {
    if (!principal) return;
    
    try {
      setLoading(true);
      const allRaffles = await Draffle_backend.getAllRaffles();
      
      const created = allRaffles.filter(raffle => 
        raffle.creator.toString() === principal.toString()
      );
      
      const participated = [];
      for (const raffle of allRaffles) {
        if (raffle.creator.toString() !== principal.toString()) {
          try {
            const entries = await Draffle_backend.getUserEntries(raffle.id);
            if (entries.length > 0) {
              participated.push(raffle);
            }
          } catch (error) {
            console.error("Error fetching entries for raffle:", raffle.id, error);
          }
        }
      }
      
      setUserRaffles(created);
      setParticipatedRaffles(participated);
    } catch (error) {
      console.error("Error fetching user raffles:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 1e8)
      .toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 8,
      })
      .replace(/\.?0+$/, "");
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000).toLocaleDateString();
  };

  const getStatusBadge = (raffle: RaffleDetail) => {
    const now = Date.now() * 1000000;
    const isActive = !raffle.raffleCompleted && Number(raffle.endTime) > now;
    const isCompleted = raffle.raffleCompleted;
    
    if (isCompleted) {
      return <span className="status-badge completed">Completed</span>;
    } else if (isActive) {
      return <span className="status-badge active">Active</span>;
    } else {
      return <span className="status-badge expired">Expired</span>;
    }
  };

  const calculateTotalWinnings = () => {
    return participatedRaffles.reduce((total, raffle) => {
      if (raffle.raffleCompleted && raffle.winner?.toString() === principal?.toString()) {
        return total + Number(raffle.reward || 0);
      }
      return total;
    }, 0);
  };

  const calculateTotalCreated = () => {
    return userRaffles.reduce((total, raffle) => {
      return total + Number(raffle.prizePool);
    }, 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="account-container">
        <div className="auth-required">
          <h2>🔐 Authentication Required</h2>
          <p>Please connect your wallet to view your account details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>👤 My Account</h1>
        <div className="user-info">
          <div className="user-principal">
            <span className="label">Principal ID:</span>
            <span className="value">{principal?.toString()}</span>
          </div>
        </div>
      </div>

      <div className="account-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          ✨ Created ({userRaffles.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'participated' ? 'active' : ''}`}
          onClick={() => setActiveTab('participated')}
        >
          🎫 Participated ({participatedRaffles.length})
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card balance">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Current Balance</div>
                  <div className="stat-value">
                    {formatBalance(balance)} {token}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-label">Raffles Created</div>
                  <div className="stat-value">{userRaffles.length}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-content">
                  <div className="stat-label">Raffles Joined</div>
                  <div className="stat-value">{participatedRaffles.length}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-label">Total Winnings</div>
                  <div className="stat-value">{calculateTotalWinnings()} {token}</div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>🚀 Quick Actions</h3>
              <div className="action-buttons">
                <button
                  className="action-btn primary"
                  onClick={() => navigate('/new-raffle')}
                >
                  ✨ Create New Raffle
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => navigate('/')}
                >
                  🎪 Browse Raffles
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'created' && (
          <div className="raffles-section">
            <div className="section-header">
              <h3>✨ Your Created Raffles</h3>
              <div className="section-stats">
                Total Prize Pool: {calculateTotalCreated()} {token}
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading your raffles...</p>
              </div>
            ) : userRaffles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h4>No raffles created yet</h4>
                <p>Start your first raffle to engage with the community!</p>
                <button
                  className="create-btn"
                  onClick={() => navigate('/new-raffle')}
                >
                  Create Your First Raffle
                </button>
              </div>
            ) : (
              <div className="raffles-grid">
                {userRaffles.map((raffle) => (
                  <div
                    key={raffle.id.toString()}
                    className="raffle-card"
                    onClick={() => navigate(`/raffle/${raffle.id.toString()}`)}
                  >
                    <div className="card-header">
                      <h4>{raffle.title}</h4>
                      {getStatusBadge(raffle)}
                    </div>
                    <div className="card-stats">
                      <div className="stat">
                        <span>Prize Pool:</span>
                        <span>{raffle.prizePool.toString()} {token}</span>
                      </div>
                      <div className="stat">
                        <span>Entries:</span>
                        <span>{raffle.noOfEntries.toString()}</span>
                      </div>
                      <div className="stat">
                        <span>Created:</span>
                        <span>{formatTime(raffle.startTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'participated' && (
          <div className="raffles-section">
            <div className="section-header">
              <h3>🎫 Raffles You've Joined</h3>
              <div className="section-stats">
                Total Winnings: {calculateTotalWinnings()} {token}
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading your participation...</p>
              </div>
            ) : participatedRaffles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h4>No raffles joined yet</h4>
                <p>Join exciting raffles and win amazing prizes!</p>
                <button
                  className="create-btn"
                  onClick={() => navigate('/')}
                >
                  Browse Available Raffles
                </button>
              </div>
            ) : (
              <div className="raffles-grid">
                {participatedRaffles.map((raffle) => (
                  <div
                    key={raffle.id.toString()}
                    className={`raffle-card ${
                      raffle.raffleCompleted && raffle.winner?.toString() === principal?.toString() 
                        ? 'winner' 
                        : ''
                    }`}
                    onClick={() => navigate(`/raffle/${raffle.id.toString()}`)}
                  >
                    <div className="card-header">
                      <h4>{raffle.title}</h4>
                      {getStatusBadge(raffle)}
                    </div>
                    <div className="card-stats">
                      <div className="stat">
                        <span>Prize Pool:</span>
                        <span>{raffle.prizePool.toString()} {token}</span>
                      </div>
                      <div className="stat">
                        <span>Total Entries:</span>
                        <span>{raffle.noOfEntries.toString()}</span>
                      </div>
                      {raffle.raffleCompleted && raffle.winner?.toString() === principal?.toString() && (
                        <div className="stat winner-stat">
                          <span>🏆 You Won:</span>
                          <span>{raffle.reward?.toString() || 0} {token}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;