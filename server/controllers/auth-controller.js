const prisma = require("../middlewares/prisma-filter");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { setTokenCookies } = require("../utils/generateToken");
const { sendVerificationEmail } = require("../utils/mailer");

const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role = "CUSTOMER", salonName, address, city, pincode, openingTime, closingTime } = req.body;

        const userExist = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
        if (userExist) {
            return res.status(409).json({ msg: "User already exists" });
        }

        // Generate email verification token — 24 h expiry
        const emailVerifyToken  = crypto.randomBytes(32).toString('hex');
        const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = await prisma.user.create({
            data: {
                name, email, phone,
                password,
                role,
                emailVerifyToken,
                emailVerifyExpiry,
                ...(role === "SALON_OWNER" && {
                    salon: { create: { salonName, address, city, pincode, openingTime, closingTime } }
                }),
                ...(role === "CUSTOMER" && {
                    customer: { create: {} }
                })
            }
        });

        // Fire-and-forget — don't fail registration if mail service is down
        sendVerificationEmail(email, name, emailVerifyToken).catch((err) =>
            console.error("Verification email failed:", err.message)
        );

        setTokenCookies(res, newUser);
        res.status(201).json({ msg: "Account created! Check your email to verify your address." });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userExist = await prisma.user.findUnique({ where: { email } });

        if (!userExist) {
            return res.status(401).json({ msg: "Wrong email or password." });
        }

        const validUser = await bcrypt.compare(password, userExist.password);
        if (!validUser) {
            return res.status(401).json({ msg: "Wrong email or password." });
        }

        setTokenCookies(res, userExist);
        res.status(200).json({ msg: "Login successful" });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies?.access_token;

        if (token) {
            // Decode without verifying (it may already be expired — we still want to block it)
            const jwt = require("jsonwebtoken");
            let expiresAt;
            try {
                const decoded = jwt.decode(token);
                // decoded.exp is Unix seconds → convert to JS Date
                expiresAt = decoded?.exp
                    ? new Date(decoded.exp * 1000)
                    : new Date(Date.now() + 15 * 60 * 1000); // fallback: now + 15 min
            } catch {
                expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            }

            // Save to blocklist — ignore duplicate errors (user clicking logout twice)
            await prisma.blockedToken.upsert({
                where:  { token },
                update: {},
                create: { token, expiresAt },
            });
        }

        res.clearCookie("access_token");
        res.clearCookie("refresh_token", { path: "/api/refresh" });
        res.status(200).json({ msg: "Logged out" });
    } catch (error) {
        // Still clear cookies even if DB write fails
        res.clearCookie("access_token");
        res.clearCookie("refresh_token", { path: "/api/refresh" });
        res.status(200).json({ msg: "Logged out" });
    }
};

module.exports = { login, register, logout };
