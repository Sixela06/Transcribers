interface GoogleAuthResponse {
  credential: string;
  client_id: string;
}

export const initializeGoogleAuth = () => {
  // Load Google Identity Services script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
    }
  };
};

const handleGoogleResponse = async (response: GoogleAuthResponse) => {
  try {
    // Send the credential to your backend
    const authResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await authResponse.json();
    
    if (authResponse.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Google auth failed:', error);
  }
};

export const signInWithGoogle = () => {
  if (window.google) {
    window.google.accounts.id.prompt();
  }
};

// Declare global types for Google
declare global {
  interface Window {
    google: any;
  }
}