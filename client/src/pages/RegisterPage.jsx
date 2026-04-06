import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   Gentle Water / Aurora Background Canvas
   - Soft animated gradient aurora waves
   - Slow-rising light orbs (like sunlight through water)
   - Very subtle: low opacity, slow speed
───────────────────────────────────────────── */

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

function createOrb(w, h) {
    return {
        x: randomBetween(w * 0.05, w * 0.95),
        y: randomBetween(h * 0.2, h + 80),
        radius: randomBetween(30, 90),
        speedY: randomBetween(0.12, 0.35),
        speedX: randomBetween(-0.08, 0.08),
        opacity: randomBetween(0.04, 0.13),
        pulse: randomBetween(0, Math.PI * 2),
        pulseSpeed: randomBetween(0.005, 0.015),
        hue: randomBetween(170, 230), // teal → sky-blue
    };
}

function createRipple(w, h) {
    return {
        x: randomBetween(w * 0.1, w * 0.9),
        y: randomBetween(h * 0.3, h * 0.9),
        radius: randomBetween(10, 30),
        maxRadius: randomBetween(80, 200),
        speed: randomBetween(0.35, 0.7),
        opacity: randomBetween(0.06, 0.14),
    };
}

const WaterCanvas = () => {
    const canvasRef = useRef(null);
    const orbsRef = useRef([]);
    const ripplesRef = useRef([]);
    const animRef = useRef(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            orbsRef.current = Array.from({ length: 10 }, () =>
                createOrb(canvas.width, canvas.height)
            );
            // Spread orbs vertically so they don't all start at bottom
            orbsRef.current.forEach((o, i) => {
                if (i < 5) o.y = randomBetween(0, canvas.height);
            });
            ripplesRef.current = Array.from({ length: 5 }, () =>
                createRipple(canvas.width, canvas.height)
            );
        };

        resize();
        window.addEventListener('resize', resize);

        const spawnRipple = () => {
            const { width, height } = canvas;
            ripplesRef.current.push(createRipple(width, height));
            if (ripplesRef.current.length > 9) ripplesRef.current.shift();
        };

        const tick = () => {
            tickRef.current++;
            const { width, height } = canvas;

            // Spawn a ripple occasionally
            if (tickRef.current % 160 === 0) spawnRipple();

            ctx.clearRect(0, 0, width, height);

            /* ── Background gradient (dawn water) ── */
            const bg = ctx.createLinearGradient(0, 0, width, height);
            bg.addColorStop(0, '#0b1f3a');
            bg.addColorStop(0.5, '#0d2d4a');
            bg.addColorStop(1, '#091a2e');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);

            /* ── Subtle aurora band ── */
            const t = tickRef.current;
            for (let i = 0; i < 3; i++) {
                const cx = width * (0.25 + i * 0.25 + 0.04 * Math.sin(t * 0.003 + i));
                const cy = height * (0.35 + 0.05 * Math.sin(t * 0.002 + i * 1.1));
                const rx = width * 0.28;
                const ry = height * 0.22;
                const hue = 185 + i * 20 + 8 * Math.sin(t * 0.004 + i);
                const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
                grd.addColorStop(0, `hsla(${hue}, 70%, 55%, 0.07)`);
                grd.addColorStop(1, 'hsla(200, 60%, 40%, 0)');
                ctx.save();
                ctx.scale(1, ry / rx);
                ctx.beginPath();
                ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
                ctx.restore();
            }

            /* ── Rising orbs (light through water) ── */
            orbsRef.current.forEach((orb, i) => {
                orb.y -= orb.speedY;
                orb.x += orb.speedX + 0.05 * Math.sin(tickRef.current * 0.012 + i);
                orb.pulse += orb.pulseSpeed;
                const pulseFactor = 0.9 + 0.1 * Math.sin(orb.pulse);
                const r = orb.radius * pulseFactor;

                if (orb.y < -orb.radius * 2) {
                    orbsRef.current[i] = createOrb(width, height);
                    orbsRef.current[i].y = height + orb.radius;
                }

                const grd = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
                grd.addColorStop(0, `hsla(${orb.hue}, 70%, 75%, ${orb.opacity})`);
                grd.addColorStop(0.5, `hsla(${orb.hue}, 65%, 60%, ${orb.opacity * 0.4})`);
                grd.addColorStop(1, `hsla(${orb.hue}, 60%, 50%, 0)`);
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
            });

            /* ── Water ripples ── */
            ripplesRef.current = ripplesRef.current.filter((rip) => {
                rip.radius += rip.speed;
                const progress = rip.radius / rip.maxRadius;
                const alpha = rip.opacity * (1 - progress);
                if (alpha <= 0.005) return false;
                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(130, 210, 255, ${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                return true;
            });

            /* ── Subtle surface shimmer at very top ── */
            const shimmer = ctx.createLinearGradient(0, 0, 0, height * 0.12);
            shimmer.addColorStop(0, 'rgba(100, 200, 255, 0.04)');
            shimmer.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.fillStyle = shimmer;
            ctx.fillRect(0, 0, width, height * 0.12);

            animRef.current = requestAnimationFrame(tick);
        };

        animRef.current = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'block',
            }}
        />
    );
};

/* ─── Shared input style helper ─── */
const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.65rem 0.9rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.07)',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(180, 225, 255, 0.75)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
};

const focusIn = (e) => {
    e.target.style.borderColor = 'rgba(80, 180, 255, 0.65)';
    e.target.style.boxShadow = '0 0 0 3px rgba(60,160,255,0.15)';
};
const focusOut = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.18)';
    e.target.style.boxShadow = 'none';
};

/* ─── Register Page ─── */
const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'citizen',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }
        const res = await register(formData);
        if (res.success) {
            navigate('/login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                overflow: 'hidden',
            }}
        >
            {/* Animated water background */}
            <WaterCanvas />

            {/* Very light blur overlay for readability */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backdropFilter: 'blur(0.5px)',
                    WebkitBackdropFilter: 'blur(0.5px)',
                    pointerEvents: 'none',
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}
            >
                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '24px',
                        padding: '2rem 2.2rem',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1) inset',
                    }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div
                            style={{
                                fontSize: '2.3rem',
                                marginBottom: '0.4rem',
                                filter: 'drop-shadow(0 2px 10px rgba(80,180,255,0.5))',
                            }}
                        >
                            🌊
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                letterSpacing: '-0.4px',
                                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                            }}
                        >
                            Create Account
                        </h1>
                        <p
                            style={{
                                marginTop: '0.35rem',
                                color: 'rgba(180, 225, 255, 0.65)',
                                fontSize: '0.88rem',
                            }}
                        >
                            Join us in making our environment cleaner
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                padding: '0.65rem 0.9rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem',
                                color: '#ff8585',
                                background: 'rgba(255,60,60,0.1)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,80,80,0.22)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                required
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 00000 00000"
                                required
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                            />
                        </div>

                        {/* Side-by-side password fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={inputStyle}
                                    onFocus={focusIn}
                                    onBlur={focusOut}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={inputStyle}
                                    onFocus={focusIn}
                                    onBlur={focusOut}
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(40,130,220,0.5)' }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: '0.4rem',
                                width: '100%',
                                padding: '0.82rem',
                                borderRadius: '9999px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #2196f3 0%, #0d6ecd 100%)',
                                color: '#ffffff',
                                fontSize: '0.97rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                boxShadow: '0 4px 18px rgba(30,100,210,0.4)',
                                transition: 'background 0.2s',
                            }}
                        >
                            Create Account
                        </motion.button>
                    </form>

                    <div
                        style={{
                            marginTop: '1.2rem',
                            textAlign: 'center',
                            fontSize: '0.88rem',
                            color: 'rgba(180, 225, 255, 0.6)',
                        }}
                    >
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            style={{
                                color: '#64b5f6',
                                fontWeight: 600,
                                textDecoration: 'none',
                                borderBottom: '1px solid rgba(100,181,246,0.4)',
                                transition: 'color 0.2s',
                            }}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
