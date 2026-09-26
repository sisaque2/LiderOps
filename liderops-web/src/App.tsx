import { useState } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import LeadsCleaner from './pages/LeadsCleaner';
import SlaCalculator from './pages/SlaCalculator';
import FretesCalculator from './pages/FretesCalculator';
import EmailGenerator from './pages/EmailGenerator';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {currentScreen === 'login' ? (
        <Login onLogin={() => navigateTo('leads')} />
      ) : (
        <>
          <Header onNavigate={navigateTo} activeScreen={currentScreen} />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {currentScreen === 'leads' && <LeadsCleaner />}
            {currentScreen === 'sla' && <SlaCalculator />}
            {currentScreen === 'fretes' && <FretesCalculator />}
            {currentScreen === 'emails' && <EmailGenerator />}
          </main>
        </>
      )}
    </div>
  );
}