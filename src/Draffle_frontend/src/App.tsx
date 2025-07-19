import "./App.scss";
import RaffleForm from "./RaffleForm";
import RaffleList from "./RaffleList";
import Navigation from "./Navigation";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RaffleDetail from "./RaffleDetail";
import Account from "./Account";
import { AuthProvider } from "./use-auth-client";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <header className="header">
            <div className="logo">
              <h1>🎯 Draffle</h1>
              <p>Decentralized Raffle Platform</p>
            </div>
            <Navigation />
          </header>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<RaffleList />} />
              <Route path="/new-raffle" element={<RaffleForm />} />
              <Route path="/raffle/:id" element={<RaffleDetail />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;