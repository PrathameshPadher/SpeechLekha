import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Github, Shield, Heart } from 'lucide-react';
import { Brand } from '../Brand';

export const MarketingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="marketing-footer-wrapper">
      <div className="marketing-footer-inner">
        <div className="marketing-footer-top">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Brand onClick={() => navigate('/')} />
            <p className="footer-tagline">
              Voice to Structured Knowledge. Transform spoken thoughts into interconnected, self-hosted Obsidian-compatible vaults.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">
                <Shield size={12} />
                <span>100% Local & Private</span>
              </span>
              <span className="footer-badge">
                <Github size={12} />
                <span>Apache 2.0</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/product">Product</Link>
              </li>
              <li>
                <Link to="/how-it-works">How it works</Link>
              </li>
              <li>
                <Link to="/open-source">Open source</Link>
              </li>
            </ul>
          </div>

          {/* Workspace Links */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Workspace</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/speak">Live Speaking</Link>
              </li>
              <li>
                <Link to="/app">Knowledge Vault</Link>
              </li>
              <li>
                <Link to="/graph">3D Knowledge Graph</Link>
              </li>
              <li>
                <Link to="/search">Semantic Search</Link>
              </li>
            </ul>
          </div>

          {/* CTA Box */}
          <div className="footer-cta-col">
            <h4 className="footer-col-title">Get Started</h4>
            <p className="footer-cta-desc">
              Experience zero-friction voice knowledge synthesis right in your browser.
            </p>
            <button className="footer-action-btn" onClick={() => navigate('/speak')}>
              <Mic size={15} />
              <span>Start Speaking</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="marketing-footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} SpeechLekha. All rights reserved.</span>
            <span className="footer-sep">•</span>
            <span>Self-Hosted & Private by Design</span>
          </div>

          <div className="footer-bottom-right">
            <Link to="/open-source">Privacy & Security</Link>
            <span className="footer-sep">•</span>
            <Link to="/open-source">Open Source License</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
