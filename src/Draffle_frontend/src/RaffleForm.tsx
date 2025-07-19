import "./RaffleForm.scss";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Draffle_backend } from "../../declarations/Draffle_backend";
import { approve, tokenBalance, transferFee } from "./utils/icrc2Ledger";
import { useAuth } from "./use-auth-client";

function RaffleForm() {
  const [title, setTitle] = useState("");
  const [entryPrice, setEntryPrice] = useState(1);
  const [initialPrize, setInitialPrize] = useState(10);
  const [duration, setDuration] = useState(300);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>(undefined);

  const navigate = useNavigate();
  const { principal } = useAuth();

  const createRaffle = async () => {
    if (!title.trim()) {
      setLastError("Please enter a raffle title");
      return;
    }

    const fee = Number(await transferFee());
    const balance = Number(await tokenBalance(principal!));
    const amount = initialPrize * 1e8 + fee;

    if (balance < amount + fee) {
      setLastError("Insufficient balance to create raffle");
      return;
    }

    setSaving(true);
    setLastError(undefined);

    try {
      await approve(amount);
      let newRaffle = {
        title: title.trim(),
        entryPrice: BigInt(entryPrice),
        initialPrize: BigInt(initialPrize),
        duration: BigInt(duration),
      };
      await Draffle_backend.startRaffle(newRaffle);
      navigate("/");
    } catch (error: any) {
      const errorText: string = error.toString();
      if (errorText.indexOf("Anonymous caller") >= 0) {
        setLastError("You must connect your wallet first");
      } else if (errorText.indexOf("transfer failed") >= 0) {
        setLastError("Token transfer failed. Please check your balance and try again.");
      } else {
        setLastError(errorText);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}m`;
    }
  };

  const updateDuration = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    setDuration(newHours * 3600 + newMinutes * 60);
  };

  const setPresetDuration = (h: number, m: number) => {
    updateDuration(h, m);
  };

  const presetDurations = [
    { label: '5 min', hours: 0, minutes: 5 },
    { label: '15 min', hours: 0, minutes: 15 },
    { label: '30 min', hours: 0, minutes: 30 },
    { label: '1 hour', hours: 1, minutes: 0 },
    { label: '2 hours', hours: 2, minutes: 0 },
    { label: '1 day', hours: 24, minutes: 0 },
  ];

  return (
    <div className="raffle-form-container">
      <div className="form-header">
        <h2>✨ Create New Raffle</h2>
        <p>Set up your raffle and let participants enter for a chance to win!</p>
      </div>

      <div className="raffle-form" style={{ opacity: saving ? 0.6 : 1 }}>
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">
              🎯 Raffle Title
              <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter an exciting raffle title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              maxLength={100}
            />
            <div className="input-help">
              Make it catchy to attract more participants!
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">💰 Entry Price (ICP)</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={100}
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseInt(e.target.value) || 1)}
                disabled={saving}
              />
              <div className="input-help">
                Cost for each raffle entry
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">🏆 Initial Prize (ICP)</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={1000}
                value={initialPrize}
                onChange={(e) => setInitialPrize(parseInt(e.target.value) || 1)}
                disabled={saving}
              />
              <div className="input-help">
                Your contribution to the prize pool
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">⏰ Duration</label>
            
            <div className="duration-presets">
              {presetDurations.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`preset-btn ${
                    hours === preset.hours && minutes === preset.minutes ? 'active' : ''
                  }`}
                  onClick={() => setPresetDuration(preset.hours, preset.minutes)}
                  disabled={saving}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="duration-custom">
              <div className="time-inputs">
                <div className="time-input-group">
                  <label>Hours</label>
                  <div className="input-with-steppers">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateDuration(Math.max(0, hours - 1), minutes)}
                      disabled={saving || hours <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="time-input"
                      min={0}
                      max={168}
                      value={hours}
                      onChange={(e) => updateDuration(parseInt(e.target.value) || 0, minutes)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateDuration(hours + 1, minutes)}
                      disabled={saving || hours >= 168}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="time-input-group">
                  <label>Minutes</label>
                  <div className="input-with-steppers">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateDuration(hours, Math.max(0, minutes - 1))}
                      disabled={saving || (hours === 0 && minutes <= 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="time-input"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => updateDuration(hours, parseInt(e.target.value) || 0)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateDuration(hours, Math.min(59, minutes + 1))}
                      disabled={saving || minutes >= 59}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="duration-display">
              Total: {formatDuration(duration)}
            </div>
            
            <div className="input-help">
              How long participants can enter the raffle
            </div>
          </div>
        </div>

        <div className="prize-preview">
          <h3>📊 Prize Pool Preview</h3>
          <div className="preview-stats">
            <div className="preview-stat">
              <span className="stat-label">Your Initial Prize:</span>
              <span className="stat-value">{initialPrize} ICP</span>
            </div>
            <div className="preview-stat">
              <span className="stat-label">Entry Price:</span>
              <span className="stat-value">{entryPrice} ICP each</span>
            </div>
            <div className="preview-note">
              💡 The prize pool grows with each entry! Winner gets 50% of the total pool.
            </div>
          </div>
        </div>

        {lastError && (
          <div className="error-message">
            ❌ {lastError}
          </div>
        )}

        <div className="form-actions">
          <button
            className="cancel-btn"
            onClick={() => navigate("/")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="create-btn"
            onClick={createRaffle}
            disabled={saving || !title.trim()}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              <>
                🚀 Create Raffle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RaffleForm;