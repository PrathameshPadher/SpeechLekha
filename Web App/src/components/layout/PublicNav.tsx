import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { Brand } from '../Brand';

export const PublicNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="nav public-page-nav">
      <Brand onClick={() => navigate('/')} />
      <div className="links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/product" className={location.pathname === '/product' ? 'active' : ''}>
          Product
        </Link>
        <Link to="/how-it-works" className={location.pathname === '/how-it-works' ? 'active' : ''}>
          How it works
        </Link>
        <Link to="/open-source" className={location.pathname === '/open-source' ? 'active' : ''}>
          Open source
        </Link>
        <a href="/SpeechLekha-Setup.exe" download="SpeechLekha-Setup.exe">
          Download
        </a>
      </div>
      <button className="glass" onClick={() => navigate('/speak')}>
        <Mic size={15} />
        Start Speaking
      </button>
    </div>
  );
};
