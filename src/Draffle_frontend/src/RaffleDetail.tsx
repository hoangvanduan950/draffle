import "./RaffleDetail.scss";
import { useEffect, useState } from "react";
import { RaffleDetail } from "../../declarations/Draffle_backend/Draffle_backend.did";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./use-auth-client";
import { Draffle_backend } from "../../declarations/Draffle_backend";
import {
  approve,
  tokenBalance,
  tokenSymbol,
  transferFee,
} from "./utils/icrc2Ledger";

function RaffleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const raffleId = BigInt(id as string);

  const [raffleDetails, setRaffleDetails] = useState<RaffleDetail | undefined>();
  const [userEntries, setUserEntries] = useState<bigint[]>([]);
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string>("");
  const [numEntries, setNumEntries] = useState(1);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { principal, isAuthenticated } = useAuth();

  const fetchFromBackend = async () => {
    try {
      setRaffleDetails(await Draffle_backend.getRaffleDetail(raffleId));
      if (isAuthenticated) {
        setUserEntries(await Draffle_backend.getUserEntries(raffleId));
      }
    } catch (error) {
      console.error("Error fetching raffle details:", error);
    }
  };

  useEffect(() => {
    fetchFromBackend();
  }, [raffleId, isAuthenticated]);

  useEffect(() => {
    tokenSymbol().then(setToken);
  }, []);

  // Timer effect for countdown
  useEffect(() => {
    if (!raffleDetails || raffleDetails.raffleCompleted) return;

    const timer = setInterval(() => {
      const now = Date.now() * 1000000;
      const remaining = Number(raffleDetails.endTime) - now;
      
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
        return;
      }

      const seconds = Math.floor(remaining / 1000000000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours % 24}h ${minutes % 60}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes % 60}m ${seconds % 60}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds % 60}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [raffleDetails]);

  const formatTime = (timestamp: bigint) =>
    new Date(Number(timestamp) / 1_000_000).toLocaleString();

  const handleBuyEntries = async () => {
    if (numEntries < 1) return;

    const fee = Number(await transferFee());
    const balance = Number(await tokenBalance(principal!));
    const amount = Number(raffleDetails?.entryPrice) * numEntries * 1e8 + fee;

    if (balance < amount + fee) {
      setLastError("Insufficient balance to buy entries");
      return;
    }

    try {
      setSaving(true);
      setLastError(undefined);
      await approve(amount);
      await Draffle_backend.buyEntries(raffleId, BigInt(numEntries));
      setNumEntries(1);
      fetchFromBackend();
    } catch (error: any) {
      const errorText: string = error.toString();
      if (errorText.indexOf("Anonymous caller") >= 0) {
        setLastError("Please connect your wallet first");
      } else if (errorText.indexOf("transfer failed") >= 0) {
        setLastError("Token transfer failed. Please check your balance.");
      } else {
        setLastError(errorText);
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusInfo = () => {
    if (!raffleDetails) return { status: "Loading", color: "#666" };
    
    if (raffleDetails.raffleCompleted) {
      return { status: "🏆 Completed", color: "#f59e0b" };
    }
    
    const now = Date.now() * 1000000;
    const isActive = Number(raffleDetails.endTime) > now;
    
    if (isActive) {
      return { status: "🔥 Active", color: "#10b981" };
    } else {
      return { status: "⏰ Expired", color: "#ef4444" };
    }
  };

  const totalCost = raffleDetails ? Number(raffleDetails.entryPrice) * numEntries : 0;
  const statusInfo = getStatusInfo();

  if (!raffleDetails) {
    return (
      <div className="raffle-detail-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading raffle details...</p>
        </div>
      </div>
    );
  }

  const canBuyEntries = !raffleDetails.raffleCompleted && 
                       Number(raffleDetails.endTime) > Date.now() * 1000000;

  return (
    <div className="raffle-detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Raffles
        </button>
        <div className="status-badge" style={{ backgroundColor: statusInfo.color }}>
          {statusInfo.status}
        </div>
      </div>

      <div className="raffle-detail-card">
        <div className="card-header">
          <h1 className="raffle-title">{raffleDetails.title}</h1>
          {!raffleDetails.raffleCompleted && timeLeft && (
            <div className="countdown">
              <span className="countdown-label">Time left:</span>
              <span className="countdown-value">{timeLeft}</span>
            </div>
          )}
        </div>

        <div className="raffle-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Prize Pool</div>
              <div className="stat-value">{raffleDetails.prizePool.toString()} {token}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-content">
              <div className="stat-label">Total Entries</div>
              <div className="stat-value">{raffleDetails.noOfEntries.toString()}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Participants</div>
              <div className="stat-value">{raffleDetails.numberOfParticipants.toString()}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-label">Entry Price</div>
              <div className="stat-value">{raffleDetails.entryPrice.toString()} {token}</div>
            </div>
          </div>
        </div>

        <div className="raffle-info">
          <div className="info-section">
            <h3>📋 Raffle Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Creator:</span>
                <span className="info-value creator">
                  {raffleDetails.creator.toString().slice(0, 8)}...
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Started:</span>
                <span className="info-value">{formatTime(raffleDetails.startTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ends:</span>
                <span className="info-value">{formatTime(raffleDetails.endTime)}</span>
              </div>
            </div>
          </div>

          {raffleDetails.raffleCompleted && raffleDetails.winner && (
            <div className="winner-section">
              <h3>🏆 Winner Announcement</h3>
              <div className="winner-card">
                <div className="winner-info">
                  <span className="winner-label">Winner:</span>
                  <span className="winner-address">
                    {raffleDetails.winner.toString().slice(0, 12)}...
                  </span>
                </div>
                <div className="winner-info">
                  <span className="winner-label">Winning Entry:</span>
                  <span className="winning-entry">
                    #{raffleDetails.winningEntry?.toString() || "N/A"}
                  </span>
                </div>
                <div className="winner-info">
                  <span className="winner-label">Prize Won:</span>
                  <span className="prize-won">
                    {raffleDetails.reward?.toString() || "0"} {token}
                  </span>
                </div>
              </div>
            </div>
          )}

          {userEntries.length > 0 && (
            <div className="user-entries-section">
              <h3>🎫 Your Entries</h3>
              <div className="entries-grid">
                {userEntries.map((entry, index) => (
                  <span
                    key={index}
                    className={`entry-number ${
                      entry === raffleDetails.winningEntry?.[0] ? "winning-entry" : ""
                    }`}
                  >
                    #{entry.toString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {canBuyEntries && isAuthenticated && (
          <div className="buy-entries-section">
            <h3>🎯 Buy Entries</h3>
            <div className="buy-entries-form">
              <div className="entry-controls">
                <label htmlFor="numEntries">Number of Entries:</label>
                <div className="entry-input-group">
                  <button
                    className="entry-btn"
                    onClick={() => setNumEntries(Math.max(1, numEntries - 1))}
                    disabled={numEntries <= 1 || saving}
                  >
                    -
                  </button>
                  <input
                    id="numEntries"
                    type="number"
                    min="1"
                    max="100"
                    value={numEntries}
                    onChange={(e) => setNumEntries(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={saving}
                  />
                  <button
                    className="entry-btn"
                    onClick={() => setNumEntries(numEntries + 1)}
                    disabled={saving}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cost-summary">
                <div className="cost-item">
                  <span>Entry Price:</span>
                  <span>{raffleDetails.entryPrice.toString()} {token}</span>
                </div>
                <div className="cost-item">
                  <span>Quantity:</span>
                  <span>{numEntries}</span>
                </div>
                <div className="cost-item total">
                  <span>Total Cost:</span>
                  <span>{totalCost} {token}</span>
                </div>
              </div>

              <button
                className="buy-btn"
                onClick={handleBuyEntries}
                disabled={saving || numEntries < 1}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    🎫 Buy {numEntries} {numEntries === 1 ? "Entry" : "Entries"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!canBuyEntries && !raffleDetails.raffleCompleted && (
          <div className="expired-notice">
            ⏰ This raffle has expired. No more entries can be purchased.
          </div>
        )}

        {!isAuthenticated && canBuyEntries && (
          <div className="auth-notice">
            🔐 Please connect your wallet to buy entries.
          </div>
        )}

        {lastError && (
          <div className="error-message">
            ❌ {lastError}
          </div>
        )}
      </div>
    </div>
  );
}

export default RaffleDetailPage;