const crypto = require('crypto');
const prisma  = require('../middlewares/prisma-filter');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

/* ── GET /api/auth/verify-email/:token ──────────────────────────────────── */
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const user = await prisma.user.findFirst({
            where: { emailVerifyToken: token, emailVerifyExpiry: { gte: new Date() } },
        });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired verification link.' });

        await prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
        });
        return res.status(200).json({ msg: 'Email verified successfully!' });
    } catch (err) { next(err); }
};

/* ── POST /api/auth/resend-verification  body: { email } ───────────────── */
const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)                return res.status(404).json({ msg: 'No account with that email.' });
        if (user.isEmailVerified) return res.status(400).json({ msg: 'Email is already verified.' });

        const token  = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
        });
        await sendVerificationEmail(user.email, user.name, token);
        return res.status(200).json({ msg: 'Verification email resent!' });
    } catch (err) { next(err); }
};

/* ── POST /api/auth/forgot-password  body: { email } ───────────────────── */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const GENERIC = "If that email is registered, we've sent a reset link.";
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(200).json({ msg: GENERIC });

        const token  = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 h
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: token, passwordResetExpiry: expiry },
        });
        await sendPasswordResetEmail(user.email, user.name, token);
        return res.status(200).json({ msg: GENERIC });
    } catch (err) { next(err); }
};

/* ── POST /api/auth/reset-password  body: { token, newPassword } ────────── */
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        const user = await prisma.user.findFirst({
            where: { passwordResetToken: token, passwordResetExpiry: { gte: new Date() } },
        });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired reset link.' });

        // Pass plain password — prisma-filter extension hashes it automatically on update
        await prisma.user.update({
            where: { id: user.id },
            data: { password: newPassword, passwordResetToken: null, passwordResetExpiry: null },
        });
        return res.status(200).json({ msg: 'Password reset successfully!' });
    } catch (err) { next(err); }
};

module.exports = { verifyEmail, resendVerification, forgotPassword, resetPassword };
