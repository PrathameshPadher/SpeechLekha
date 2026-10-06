import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { Brand } from '../components/Brand';

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

export const Landing: React.FC = () => {
  const nav = useNavigate();

  return (
    <main className="landing">
      <video className="video" autoPlay loop muted playsInline src={VIDEO} />
      <div className="nav">
        <Brand onClick={() => nav('/')} />
        <div className="links">
          <Link to="/">Home</Link>
          <Link to="/product">Product</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/open-source">Open source</Link>
          <a href="/SpeechLekha-Setup.exe" download="SpeechLekha-Setup.exe">Download</a>
        </div>
        <button className="glass" onClick={() => nav('/speak')}>
          <Mic size={15} />
          Start Speaking
        </button>
      </div>
      <section className="hero">
        <span className="eyebrow">SPEECHLEKHA · VOICE TO KNOWLEDGE</span>
        <h1>
          Don’t write,<br />
          <em>just speak.</em>
        </h1>
        <p>
          Turn your voice into clear, structured knowledge — with notes, tables, diagrams and links building themselves live.
        </p>
        <button className="voice" onClick={() => nav('/speak')}>
          <span className="bars">
            {Array.from({ length: 19 }, (_, i) => (
              <i key={i} style={{ animationDelay: `-${i * 45}ms` }} />
            ))}
          </span>
          <b />
          Start Speaking
        </button>
        <small>Self-hosted · Open source · Your knowledge stays yours</small>
      </section>
    </main>
  );
};
