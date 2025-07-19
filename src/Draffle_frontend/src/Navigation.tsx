import "./Navigation.scss";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./use-auth-client";
import { useNavigate } from "react-router-dom";

function Navigation() {
  const { isAuthenticated, login, logout, principal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const formatPrincipalId = (principalId: string) => {
    if (principalId.length <= 12) return principalId;
    return `${principalId.slice(0, 6)}...${principalId.slice(-6)}`;
  };

  return (
    <nav className="navigation">
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          🎪 All Raffles
        </Link>
        {isAuthenticated && (
          <Link 
            to="/new-raffle" 
            className={`nav-link ${isActive('/new-raffle') ? 'active' : ''}`}
          >
            ✨ Create Raffle
          </Link>
        )}
        {isAuthenticated && (
          <Link 
            to="/account" 
            className={`nav-link ${isActive('/account') ? 'active' : ''}`}
          >
            👤 My Account
          </Link>
        )}
      </div>
      
      <div className="auth-section">
        {isAuthenticated && (
          <div className="user-info">
            <span className="user-label">Connected:</span>
            <span className="user-principal" title={principal?.toString()}>
              {formatPrincipalId(principal?.toString() || "")}
            </span>
          </div>
        )}
        
        {!isAuthenticated ? (
          <button className="auth-btn login-btn" onClick={login}>
            🔐 Connect Wallet
          </button>
        ) : (
          <button
            className="auth-btn logout-btn"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            🚪 Disconnect
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navigation;