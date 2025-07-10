import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (currentUser) {
    return <Dashboard username={currentUser} onLogout={handleLogout} />;
  }

  return <LoginForm onLogin={handleLogin} />;
};

export default Index;
