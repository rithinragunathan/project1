import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard.jsx';
import { motion } from 'framer-motion';

/* ─── Leaf particle system ─── */
const LEAF_COUNT = 28;
const LEAF_SHAPES = [
    // Simple SVG paths for different leaf types
    'M10,0 Q20,5 10,20 Q0,5 10,0Z',
    'M12,0 C20,8 20,16 12,22 C4,16 4,8 12,0Z',
    'M0,10 Q5,0 10,10 Q5,20 0,10Z',
    'M10,0 Q18,4 15,12 Q12,20 5,16 Q-2,12 2,5 Q4,1 10,0Z',
];
const LEAF_COLORS = [
    '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',  // greens
    '#FFA726', '#FB8C00', '#F57C00',              // oranges (autumn leaves)
    '#EF5350', '#E53935',                         // reds
    '#8BC34A', '#9CCC65',                         // light greens
];

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

function createLeaf(canvasWidth, canvasHeight) {
    return {
        x: randomBetween(0, canvasWidth),
        y: randomBetween(-canvasHeight * 0.5, -20),
        size: randomBetween(14, 30),
        speedY: randomBetween(0.6, 1.8),
        speedX: randomBetween(-0.6, 0.6),
        rotation: randomBetween(0, 360),
        rotationSpeed: randomBetween(-1.2, 1.2),
        opacity: randomBetween(0.55, 0.92),
        shape: LEAF_SHAPES[Math.floor(Math.random() * LEAF_SHAPES.length)],
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        wobble: randomBetween(0, Math.PI * 2),
        wobbleSpeed: randomBetween(0.02, 0.05),
        wobbleAmp: randomBetween(0.4, 1.2),
    };
}

/* ─── Firefly / bokeh particles ─── */
function createBokeh(canvasWidth, canvasHeight) {
    return {
        x: randomBetween(0, canvasWidth),
        y: randomBetween(0, canvasHeight),
        radius: randomBetween(3, 10),
        opacity: randomBetween(0.1, 0.4),
        speedX: randomBetween(-0.2, 0.2),
        speedY: randomBetween(-0.3, 0.3),
        pulse: randomBetween(0, Math.PI * 2),
        pulseSpeed: randomBetween(0.01, 0.03),
    };
}

const NatureCanvas = () => {
    const canvasRef = useRef(null);
    const leavesRef = useRef([]);
    const bokehRef = useRef([]);
    const animRef = useRef(null);
    const pathCache = useRef({});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            // Re-seed particles on resize
            leavesRef.current = Array.from({ length: LEAF_COUNT }, () =>
                createLeaf(canvas.width, canvas.height)
            );
            // Randomly distribute some leaves already on screen
            leavesRef.current.forEach((leaf, i) => {
                if (i < LEAF_COUNT / 2) leaf.y = randomBetween(0, canvas.height);
            });
            bokehRef.current = Array.from({ length: 14 }, () =>
                createBokeh(canvas.width, canvas.height)
            );
        };

        resize();
        window.addEventListener('resize', resize);

        const drawLeaf = (leaf) => {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate((leaf.rotation * Math.PI) / 180);
            ctx.globalAlpha = leaf.opacity;

            // Build SVG path2D once per shape
            if (!pathCache.current[leaf.shape]) {
                pathCache.current[leaf.shape] = new Path2D(leaf.shape);
            }

            const scale = leaf.size / 20;
            ctx.scale(scale, scale);
            ctx.translate(-10, -10); // center the path

            ctx.fillStyle = leaf.color;
            ctx.fill(pathCache.current[leaf.shape]);

            // Leaf vein
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 0.6 / scale;
            ctx.beginPath();
            ctx.moveTo(10, 2);
            ctx.lineTo(10, 18);
            ctx.stroke();

            ctx.restore();
        };

        const drawBokeh = (b) => {
            const pulse = 0.85 + 0.15 * Math.sin(b.pulse);
            const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * pulse);
            grd.addColorStop(0, `rgba(180,255,160,${b.opacity * pulse})`);
            grd.addColorStop(1, 'rgba(100,200,80,0)');
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        };

        const tick = () => {
            const { width, height } = canvas;
            // Clear with semi-transparent fill for trail effect
            ctx.clearRect(0, 0, width, height);

            // Draw background gradient
            const bgGrad = ctx.createLinearGradient(0, 0, width, height);
            bgGrad.addColorStop(0, '#0d2b1a');
            bgGrad.addColorStop(0.45, '#143d26');
            bgGrad.addColorStop(1, '#0a1f13');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Bokeh lights
            bokehRef.current.forEach((b) => {
                b.x += b.speedX;
                b.y += b.speedY;
                b.pulse += b.pulseSpeed;
                if (b.x < -20) b.x = width + 20;
                if (b.x > width + 20) b.x = -20;
                if (b.y < -20) b.y = height + 20;
                if (b.y > height + 20) b.y = -20;
                drawBokeh(b);
            });

            // Leaves
            leavesRef.current.forEach((leaf, i) => {
                leaf.wobble += leaf.wobbleSpeed;
                leaf.x += leaf.speedX + Math.sin(leaf.wobble) * leaf.wobbleAmp;
                leaf.y += leaf.speedY;
                leaf.rotation += leaf.rotationSpeed;

                if (leaf.y > height + 40 || leaf.x < -60 || leaf.x > width + 60) {
                    leavesRef.current[i] = createLeaf(width, height);
                } else {
                    drawLeaf(leaf);
                }
            });

            // Subtle horizon fog at the bottom
            const fogGrad = ctx.createLinearGradient(0, height * 0.75, 0, height);
            fogGrad.addColorStop(0, 'rgba(0,40,20,0)');
            fogGrad.addColorStop(1, 'rgba(0,30,15,0.4)');
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, height * 0.75, width, height * 0.25);

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

/* ─── Login Page ─── */
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            navigate('/');
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
                padding: '1rem',
                overflow: 'hidden',
            }}
        >
            {/* Animated nature background */}
            <NatureCanvas />

            {/* Blurred overlay for depth */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backdropFilter: 'blur(1px)',
                    WebkitBackdropFilter: 'blur(1px)',
                    pointerEvents: 'none',
                }}
            />

            {/* Login card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}
            >
                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.10)',
                        backdropFilter: 'blur(22px)',
                        WebkitBackdropFilter: 'blur(22px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                    }}
                >
                    {/* Leaf icon header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div
                            style={{
                                fontSize: '2.6rem',
                                marginBottom: '0.5rem',
                                filter: 'drop-shadow(0 2px 8px rgba(100,220,100,0.5))',
                            }}
                        >
                            🌿
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: '1.9rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                letterSpacing: '-0.5px',
                                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                            }}
                        >
                            Welcome Back
                        </h1>
                        <p
                            style={{
                                marginTop: '0.4rem',
                                color: 'rgba(200, 240, 210, 0.75)',
                                fontSize: '0.92rem',
                            }}
                        >
                            Sign in to report environmental issues
                        </p>
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: '0.7rem 1rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.875rem',
                                color: '#ff8080',
                                background: 'rgba(255,60,60,0.12)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,80,80,0.25)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '0.4rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'rgba(200,240,210,0.8)',
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(100,220,100,0.6)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(80,200,80,0.15)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '0.4rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'rgba(200,240,210,0.8)',
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(100,220,100,0.6)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(80,200,80,0.15)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(60,180,80,0.45)' }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '9999px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #3cb857 0%, #27a148 100%)',
                                color: '#ffffff',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                boxShadow: '0 4px 18px rgba(40,160,70,0.35)',
                                transition: 'background 0.2s',
                            }}
                        >
                            Sign In
                        </motion.button>
                    </form>

                    <div
                        style={{
                            marginTop: '1.4rem',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: 'rgba(200,240,210,0.65)',
                        }}
                    >
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            style={{
                                color: '#7AE89A',
                                fontWeight: 600,
                                textDecoration: 'none',
                                borderBottom: '1px solid rgba(122,232,154,0.4)',
                                transition: 'color 0.2s',
                            }}
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
