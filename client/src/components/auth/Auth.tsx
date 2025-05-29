import { useState, useRef, useEffect } from "react";
import { config } from "../../config/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Auth = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [otpTimer, setOtpTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const otpRefs = useRef([]);

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Name validation (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;

    // Start countdown timer for OTP resend
    const startOtpTimer = () => {
        setCanResend(false);
        setOtpTimer(60);
        const timer = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Validate form inputs
    const validateForm = () => {
        setError('');
        
        if (isSignup) {
            if (!name.trim()) {
                setError('Name is required');
                return false;
            }
            if (name.trim().length < 2) {
                setError('Name must be at least 2 characters long');
                return false;
            }
            if (name.trim().length > 50) {
                setError('Name must be less than 50 characters');
                return false;
            }
            if (!nameRegex.test(name.trim())) {
                setError('Name can only contain letters, spaces, hyphens, and apostrophes');
                return false;
            }
        }

        if (!email.trim()) {
            setError('Email address is required');
            return false;
        }
        
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: any) => {
        if (e) e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/send-otp`, {
                method: 'POST',
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    type: isSignup ? 'signup' : 'login', 
                    name: isSignup ? name.trim() : undefined 
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 200) {
                setShowOTP(true);
                setSuccessMessage(`Verification code sent to ${email.trim().toLowerCase()}`);
                startOtpTimer();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                // Handle specific backend error messages
                if (response.status === 400) {
                    setError(data.message || 'Invalid request. Please check your information.');
                } else if (response.status === 404) {
                    setError('User not found. Please sign up first.');
                } else if (response.status === 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(data.message || 'Failed to send verification code');
                }
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numeric input
        if (value && !/^\d$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError(''); // Clear errors when user starts typing

        // Auto-focus next input
        if (value && index < 5) {
            //@ts-ignore
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all digits are entered
        if (value && index === 5 && newOtp.every(digit => digit !== '')) {
            setTimeout(() => handleVerifyOTP(newOtp), 100);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                //@ts-ignore
                otpRefs.current[index - 1]?.focus();
            } else if (otp[index]) {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            //@ts-ignore
            otpRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            //@ts-ignore
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleVerifyOTP = async (otpArray: string[] | null = null) => {
        const otpCode = (otpArray || otp).join('');
        
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit verification code');
            return;
        }

        if (!/^\d{6}$/.test(otpCode)) {
            setError('Verification code must contain only numbers');
            return;
        }

        setError('');
        setIsVerifying(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/verify-otp`, {
                method: 'POST',
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    code: otpCode 
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 200) {
                setSuccessMessage('Verification successful! Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                // Handle specific backend error messages
                if (response.status === 400) {
                    setError(data.message || 'Invalid or expired verification code');
                } else if (response.status === 404) {
                    setError('User not found. Please try signing up again.');
                } else if (response.status === 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(data.message || 'Verification failed');
                }
                
                // Clear OTP on error and focus first input
                setOtp(['', '', '', '', '', '']);
                //@ts-ignore
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
            
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            //@ts-ignore
            setTimeout(() =>
                //@ts-ignore
                otpRefs.current[0]?.focus(), 100);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBackToEmail = () => {
        setShowOTP(false);
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccessMessage('');
        setOtpTimer(0);
        setCanResend(true);
    };

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated])

    useEffect(() => {
        if (showOTP && otpRefs.current[0]) {
            //@ts-ignore
            otpRefs.current[0].focus();
        }
    }, [showOTP]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative SVGs remain the same */}
            <svg className="absolute bottom-1/3 right-1/3 w-24 h-24 text-indigo-400/10 animate-float animation-delay-2000" viewBox="0 0 24 24" fill="none">
              <path d="M22 12H18M6 12H2M12 6V2M12 22V18M7.8 7.8L4.6 4.6M16.2 7.8L19.4 4.6M16.2 16.2L19.4 19.4M7.8 16.2L4.6 19.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg className="absolute top-1/4 left-1/4 w-20 h-20 text-blue-500/15 animate-float" viewBox="0 0 24 24" fill="none">
              <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20C6.20914 20 8 18.2091 8 16C8 13.7909 6.20914 12 4 12C1.79086 12 0 13.7909 0 16C0 18.2091 1.79086 20 4 20Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20C22.2091 20 24 18.2091 24 16C24 13.7909 22.2091 12 20 12C17.7909 12 16 13.7909 16 16C16 18.2091 17.7909 20 20 20Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-1/4 right-1/4 w-24 h-24 text-indigo-400/10 animate-float animation-delay-3000" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L2 20H22L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 10L7 18H17L12 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <svg className="absolute top-32 right-32 w-16 h-16 text-blue-400/15 animate-float animation-delay-1000" viewBox="0 0 24 24" fill="none">
              <path d="M8 12L12 8L16 12M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-32 left-32 w-16 h-16 text-indigo-500/10 animate-float animation-delay-1500" viewBox="0 0 24 24" fill="none">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 14L4 16L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 14L20 16L22 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Target SVG */}
              <svg className="absolute top-22 left-180 w-20 h-20 text-blue-500/20 animate-float" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            
              {/* Data Flow SVG */}
              <svg className="absolute bottom-1/3 right-1/3 w-24 h-24 text-indigo-400/10 animate-float animation-delay-2000" viewBox="0 0 24 24" fill="none">
                <path d="M8 12L12 8L16 12M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {!showOTP ? (
                    /* Email Form - Improved Accessibility */
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2" id="auth-heading">
                                {isSignup ? "Join Your Organization" : "Welcome Back"}
                            </h2>
                            <p className="text-blue-200" id="auth-description">
                                {isSignup ? "Create your account to manage OKRs" : "Sign in to track your objectives"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} aria-labelledby="auth-heading" aria-describedby="auth-description">
                            <div className="space-y-6">
                                {isSignup && (
                                    <div className="relative group">
                                        <label htmlFor="name" className="sr-only">Full Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/20"
                                            aria-required="true"
                                            aria-invalid={error && error.includes('Name') ? "true" : "false"}
                                            aria-describedby={error && error.includes('Name') ? "name-error" : undefined}
                                        />
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                                    </div>
                                )}

                                <div className="relative group">
                                    <label htmlFor="email" className="sr-only">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/20"
                                        aria-required="true"
                                        aria-invalid={error && error.includes('Email') ? "true" : "false"}
                                        aria-describedby={error && error.includes('Email') ? "email-error" : undefined}
                                        inputMode="email"
                                        autoComplete={isSignup ? "email" : "username"}
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                                </div>

                                {error && (
                                    <div id={error.includes('Name') ? "name-error" : error.includes('Email') ? "email-error" : "form-error"} 
                                         className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-center animate-shake"
                                         role="alert">
                                        {error}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 text-center"
                                         role="status">
                                        {successMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    aria-busy={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Sending OTP...
                                        </div>
                                    ) : (
                                        `${isSignup ? "Send Verification Code" : "Send Login Code"}`
                                    )}
                                </button>

                                <div className="text-center">
                                    <span className="text-blue-200">
                                        {isSignup ? "Already have an account?" : "Don't have an account?"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignup(!isSignup);
                                            setError('');
                                            setName('');
                                            setEmail('');
                                        }}
                                        className="ml-2 text-blue-300 hover:text-blue-200 font-semibold transition-colors duration-300 cursor-pointer"
                                        aria-label={isSignup ? "Switch to sign in" : "Switch to sign up"}
                                    >
                                        {isSignup ? "Sign In" : "Sign Up"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* OTP Verification Form - Improved Accessibility */
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform ">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                                <span className="text-2xl" aria-hidden="true">📧</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2" id="otp-heading">Verify Your Email</h2>
                            <p className="text-blue-200 mb-4" id="otp-description">
                                We've sent a 6-digit verification code to
                            </p>
                            <p className="text-blue-300 font-semibold" aria-live="polite">{email}</p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-center space-x-3 mb-6" role="group" aria-labelledby="otp-heading otp-description">
                            {otp.map((digit, index) => (
                                <div key={`otp-${index}`} className="relative">
                                    <label htmlFor={`otp-${index}`} className="sr-only">Digit {index + 1}</label>
                                    <input
                                        id={`otp-${index}`}
                                        //@ts-ignore    
                                        ref={(el: HTMLInputElement | null) => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-10 h-12 lg:w-12 lg:h-14 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/20"
                                        aria-label={`Digit ${index + 1} of verification code`}
                                        aria-describedby={index === 0 ? "otp-instructions" : undefined}
                                        autoFocus={index === 0}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                            ))}
                        </div>
                        <div id="otp-instructions" className="sr-only">Enter the 6-digit verification code sent to your email</div>

                        {error && (
                            <div id="otp-error" 
                                 className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-center mb-4 animate-shake"
                                 role="alert">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 text-center mb-4"
                                 role="status">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            <button
                                onClick={() => handleVerifyOTP()}
                                disabled={isVerifying || otp.some(digit => digit === '')}
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                                aria-busy={isVerifying}
                            >
                                {isVerifying ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 "></div>
                                        Verifying...
                                    </div>
                                ) : (
                                    "Verify & Continue"
                                )}
                            </button>

                            <button
                                onClick={handleBackToEmail}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-blue-200 font-semibold rounded-xl border border-white/20 transition-all duration-300 cursor-pointer"
                                aria-label="Go back to email entry"
                            >
                                ← Back to Email
                            </button>

                            <div className="text-center">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !canResend}
                                    className="text-blue-300 hover:text-blue-200 font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={!canResend ? `Resend code available in ${otpTimer} seconds` : 'Resend verification code'}
                                >
                                    {!canResend ? `Resend Code (${otpTimer}s)` : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-8 text-blue-300/60">
                    <p>Secure • Efficient • Professional</p>
                </div>
            </div>

            <style 
            //@ts-ignore
            jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};