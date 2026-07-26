import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import './LoginScreen.css';

interface LoginScreenProps {
  onLoginSuccess: (credentialResponse: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="login-card"
      >
        {/* Left Side (Decorative/Illustration) */}
        <div className="login-left">
          <div style={{ position: 'absolute', top: 30, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9b72e5" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>NexusChat</span>
          </div>

          <h1>Welcome back! ✨</h1>
          <p>Sign in to continue your journey and get things done securely.</p>
          
          <img 
            src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&q=80&w=800" 
            alt="Workspace" 
            className="login-image"
          />
        </div>

        {/* Right Side (Auth) */}
        <div className="login-right">
          <h2>Log in to your account</h2>
          <p className="subtitle">We're happy to see you again! 💜</p>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={onLoginSuccess}
              onError={() => console.log('Login Failed')}
              theme="outline"
              size="large"
              shape="pill"
              width={300}
              text="continue_with"
            />
          </div>

          <p className="terms-text">
            Don't have an account? Google Sign-In will automatically create one for you. <br/><br/>
            By continuing, you agree to our <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
