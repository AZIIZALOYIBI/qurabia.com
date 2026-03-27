import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#020408',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effect */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, rgba(0,255,255,0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />

      <div style={{
        zIndex: 1,
        padding: '40px',
        background: 'rgba(10,15,25,0.8)',
        border: '1px solid rgba(0,255,255,0.1)',
        borderRadius: '16px',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚛️</div>
        <h1 style={{ 
          color: '#00ffff', 
          fontSize: '20px', 
          marginBottom: '10px',
          letterSpacing: '2px'
        }}>QURABIA SUPERSYSTEM</h1>
        <p style={{ 
          color: 'rgba(0,255,255,0.6)', 
          fontSize: '12px', 
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          يرجى تسجيل الدخول باستخدام حساب جوجل للوصول إلى النواة الكمية
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                const decoded = jwtDecode(credentialResponse.credential);
                onLoginSuccess(decoded);
              }
            }}
            onError={() => {
              console.log('Login Failed');
            }}
            theme="filled_blue"
            shape="pill"
            text="signin_with"
          />
        </div>

        <div style={{ 
          marginTop: '40px', 
          fontSize: '10px', 
          color: 'rgba(0,255,255,0.3)',
          letterSpacing: '1px'
        }}>
          V5.0 SECURE ACCESS PROTOCOL
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
