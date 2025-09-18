// --- ROBUST API START ---
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { createPublicClient, createWalletClient, defineChain, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import QRCode from "qrcode";

// ---- App setup
const app = express();
app.disable("x-powered-by");

// Security headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  contentSecurityPolicy: false,
  hsts: { maxAge: 15552000, includeSubDomains: false, preload: false },
}));

// CORS (default restrict to localhost web dev or env override)
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8080";
app.use(cors({ origin: [ALLOW_ORIGIN, "http://localhost:8081", "http://127.0.0.1:8080"], credentials: true }));

// Enforce allowed hosts
const ALLOW_HOSTS = (process.env.ALLOW_HOSTS || "localhost,127.0.0.1").split(",").map(s => s.trim().toLowerCase());
app.use((req, res, next) => {
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  if (host && !ALLOW_HOSTS.includes(host)) {
    return res.status(403).json({ error: "Forbidden host" });
  }
  return next();
});

// Parse JSON bodies early (must come BEFORE routes)
app.use(express.json({ limit: "64kb" }));

// Allow CORS preflight requests universally
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

// ---- Minimal Auth Scaffold (in-memory, for development/demo)
const users = new Map(); // email -> { id, email, name, role, passwordHash, emailVerified, createdAt, updatedAt }
const sessions = new Map(); // sid -> email
const verifyTokens = new Map(); // token -> email
const resetTokens = new Map(); // token -> email

// ---- Price Visibility Control System
const priceRequests = new Map(); // requestId -> { id, batchId, requesterEmail, farmerEmail, status, createdAt, respondedAt }
const pricePermissions = new Map(); // `${batchId}_${requesterEmail}` -> { batchId, requesterEmail, farmerEmail, granted, createdAt }
const produceSettings = new Map(); // batchId -> { priceVisibility: 'public' | 'private', farmerEmail }

// ---- Profiles & Reviews (in-memory)
const userProfiles = new Map(); // email -> { location, experienceYears, mainCrops: string[], specialties: string[], avgDealSize?: number, bio?: string }
const userReviews = new Map(); // targetEmail -> [ { fromEmail, rating, comment, dateISO } ]

function getPublicProfile(email) {
  const u = users.get(email);
  if (!u) return null;
  const profile = userProfiles.get(email) || {};
  const reviews = userReviews.get(email) || [];
  const avgRating = reviews.length ? (reviews.reduce((a,r)=>a + (r.rating||0), 0) / reviews.length) : 0;
  return {
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    profile: {
      location: profile.location || '',
      experienceYears: profile.experienceYears || 0,
      mainCrops: profile.mainCrops || [],
      specialties: profile.specialties || [],
      avgDealSize: profile.avgDealSize || null,
      bio: profile.bio || ''
    },
    reviewsSummary: {
      avgRating: Math.round(avgRating * 10) / 10,
      total: reviews.length,
    }
  };
}

async function sha256(text) {
  try {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(String(text)).digest('hex');
  } catch {
    return String(text);
  }
}

async function randomToken() {
  const { randomBytes } = await import('node:crypto');
  return randomBytes(24).toString('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const obj = {};
  header.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    obj[decodeURIComponent(k)] = decodeURIComponent(rest.join('=') || '');
  });
  return obj;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  else parts.push('SameSite=Lax');
  if (opts.secure) parts.push('Secure');
  const maxAge = opts.maxAge != null ? Number(opts.maxAge) : 60 * 60 * 24 * 7; // 7 days
  parts.push(`Max-Age=${maxAge}`);
  parts.push('Path=/');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${encodeURIComponent(name)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

async function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid || !sessions.has(sid)) return res.status(401).json({ error: 'Unauthorized' });
  const email = sessions.get(sid);
  const user = users.get(email);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  return next();
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// --- Auth Routes ---
app.post('/auth/register', async (req, res) => {
  try {
    if (!/^application\/json/i.test(req.headers['content-type'] || '')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
    let { name, email, password, role } = req.body || {};
    name = (name || '').toString().trim();
    email = (email || '').toString().trim();
    password = (password || '').toString();
    // Demo-friendly default: if role omitted, assume 'farmer'
    role = (role || 'farmer').toString().trim();

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!['farmer','distributor','consumer','admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (users.has(email)) return res.status(409).json({ error: 'Email already registered' });
    const now = new Date().toISOString();
    const user = {
      id: (await randomToken()).slice(0, 12),
      email,
      name,
      role,
      passwordHash: await sha256(password),
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    users.set(email, user);
    const vtok = await randomToken();
    verifyTokens.set(vtok, email);
    console.log(`[auth] Verification link: ${req.protocol}://${req.get('host')}/verify-email?token=${vtok}`);
    const sid = await randomToken();
    sessions.set(sid, email);
    setCookie(res, 'sid', sid, { httpOnly: true, sameSite: 'Lax', secure: false });
    return res.json({ user: publicUser(user), token: sid, refreshToken: sid });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    if (!/^application\/json/i.test(req.headers['content-type'] || '')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
    const { email, password } = req.body || {};
    const user = users.get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = (await sha256(password)) === user.passwordHash;
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const sid = await randomToken();
    sessions.set(sid, email);
    setCookie(res, 'sid', sid, { httpOnly: true, sameSite: 'Lax', secure: false });
    return res.json({ user: publicUser(user), token: sid, refreshToken: sid });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/auth/me', requireAuth, (req, res) => {
  return res.json(publicUser(req.user));
});

app.post('/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (sid) sessions.delete(sid);
  clearCookie(res, 'sid');
  return res.json({ message: 'Logged out' });
});

app.post('/auth/refresh', (req, res) => {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid || !sessions.has(sid)) return res.status(401).json({ error: 'Unauthorized' });
  // For simplicity, return same sid as token
  return res.json({ token: sid });
});

app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (users.has(email)) {
      const rtok = await randomToken();
      resetTokens.set(rtok, email);
      console.log(`[auth] Reset link: ${req.protocol}://${req.get('host')}/reset-password?token=${rtok}`);
    }
    return res.json({ message: 'If an account exists, you will receive an email.' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    const email = resetTokens.get(token);
    if (!email) return res.status(400).json({ error: 'Invalid or expired token' });
    const user = users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.passwordHash = await sha256(password);
    user.updatedAt = new Date().toISOString();
    resetTokens.delete(token);
    return res.json({ message: 'Password updated' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/auth/verify-email', (req, res) => {
  try {
    const { token } = req.body || {};
    const email = verifyTokens.get(token);
    if (!email) return res.status(400).json({ error: 'Invalid or expired token' });
    const user = users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    verifyTokens.delete(token);
    return res.json({ message: 'Email verified' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = users.get(email);
    if (!user) return res.json({ message: 'If an account exists, you will receive an email.' });
    const token = await randomToken();
    verifyTokens.set(token, email);
    console.log(`[auth] Verification link: ${req.protocol}://${req.get('host')}/verify-email?token=${token}`);
    return res.json({ message: 'Verification email sent' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Profile management
app.get('/auth/profile', (req, res) => {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid || !sessions.has(sid)) return res.status(401).json({ error: 'Unauthorized' });
  const email = sessions.get(sid);
  const u = users.get(email);
  if (!u) return res.status(401).json({ error: 'Unauthorized' });
  const pub = getPublicProfile(email);
  return safeJson(res, pub);
});

app.put('/auth/profile', (req, res) => {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid || !sessions.has(sid)) return res.status(401).json({ error: 'Unauthorized' });
  const email = sessions.get(sid);
  const u = users.get(email);
  if (!u) return res.status(401).json({ error: 'Unauthorized' });

  const { name, location, experienceYears, mainCrops, specialties, avgDealSize, bio } = req.body || {};
  if (typeof name === 'string' && name.trim()) {
    u.name = name.trim();
    u.updatedAt = new Date().toISOString();
    users.set(email, u);
  }
  const current = userProfiles.get(email) || {};
  const updatedProfile = {
    ...current,
    ...(location !== undefined ? { location: String(location) } : {}),
    ...(experienceYears !== undefined ? { experienceYears: Number(experienceYears) || 0 } : {}),
    ...(Array.isArray(mainCrops) ? { mainCrops: mainCrops.map(String) } : {}),
    ...(Array.isArray(specialties) ? { specialties: specialties.map(String) } : {}),
    ...(avgDealSize !== undefined ? { avgDealSize: Number(avgDealSize) || 0 } : {}),
    ...(bio !== undefined ? { bio: String(bio) } : {}),
  };
  userProfiles.set(email, updatedProfile);

  const pub = getPublicProfile(email);
  return safeJson(res, pub);
});

app.post('/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  if ((await sha256(oldPassword)) !== req.user.passwordHash) return res.status(400).json({ error: 'Old password incorrect' });
  req.user.passwordHash = await sha256(newPassword);
  req.user.updatedAt = new Date().toISOString();
  users.set(req.user.email, req.user);
  return res.json({ message: 'Password changed' });
});

app.delete('/auth/delete', requireAuth, (req, res) => {
  users.delete(req.user.email);
  // Invalidate all sessions for this email
  for (const [sid, email] of sessions.entries()) {
    if (email === req.user.email) sessions.delete(sid);
  }
  clearCookie(res, 'sid');
  return res.json({ message: 'Account deleted' });
});

// Public profile by email
app.get('/profiles/:email', (req, res) => {
  const email = String(req.params.email || '').toLowerCase();
  if (!users.has(email)) return res.status(404).json({ error: 'User not found' });
  const pub = getPublicProfile(email);
  return safeJson(res, pub);
});

// Reviews API
app.get('/reviews/:email', (req, res) => {
  const email = String(req.params.email || '').toLowerCase();
  if (!users.has(email)) return res.status(404).json({ error: 'User not found' });
  const list = userReviews.get(email) || [];
  return safeJson(res, { reviews: list });
});

app.post('/reviews/:email', (req, res) => {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid || !sessions.has(sid)) return res.status(401).json({ error: 'Unauthorized' });
  const fromEmail = sessions.get(sid);
  const targetEmail = String(req.params.email || '').toLowerCase();
  if (!users.has(targetEmail)) return res.status(404).json({ error: 'User not found' });
  if (fromEmail === targetEmail) return res.status(400).json({ error: 'Cannot review your own profile' });
  const { rating, comment } = req.body || {};
  const r = Number(rating);
  if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Rating must be 1-5' });
  const item = {
    fromEmail,
    rating: r,
    comment: String(comment || ''),
    dateISO: new Date().toISOString(),
  };
  const arr = userReviews.get(targetEmail) || [];
  arr.push(item);
  userReviews.set(targetEmail, arr);
  return safeJson(res, { success: true });
});

// ---- Price Visibility Control Endpoints ----

// Request price view access
app.post('/price-requests', requireAuth, async (req, res) => {
  try {
    const { batchId } = req.body || {};
    const batchIdNum = typeof batchId === "string" ? Number(batchId) : batchId;
    
    if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
      return res.status(400).json({ error: "Invalid batchId" });
    }

    // Check if batch exists and get farmer info
    const db = readBatches();
    const batch = db.batches[String(batchIdNum)];
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Get farmer email from blockchain data or batch record
    let farmerEmail = null;
    try {
      const produceTuple = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getProduce",
        args: [BigInt(batchIdNum)],
      });
      const farmerAddress = Array.isArray(produceTuple) ? produceTuple[3] : undefined;
      
      // Find farmer by address (simplified - in real app you'd have address->email mapping)
      for (const [email, user] of users.entries()) {
        if (user.role === 'farmer') {
          farmerEmail = email;
          break; // For demo, assign to first farmer
        }
      }
    } catch (e) {
      return res.status(404).json({ error: "Batch not found on blockchain" });
    }

    if (!farmerEmail) {
      return res.status(404).json({ error: "Farmer not found for this batch" });
    }

    if (req.user.email === farmerEmail) {
      return res.status(400).json({ error: "Cannot request price access for your own produce" });
    }

    // Check if request already exists
    const existingRequestKey = `${batchIdNum}_${req.user.email}`;
    let existingRequest = null;
    for (const [id, request] of priceRequests.entries()) {
      if (request.batchId === batchIdNum && request.requesterEmail === req.user.email) {
        existingRequest = request;
        break;
      }
    }

    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(409).json({ error: "Price request already pending" });
    }

    // Create new request
    const requestId = await randomToken();
    const newRequest = {
      id: requestId,
      batchId: batchIdNum,
      requesterEmail: req.user.email,
      requesterName: req.user.name,
      requesterRole: req.user.role,
      farmerEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      respondedAt: null
    };

    priceRequests.set(requestId, newRequest);
    
    return res.json({ 
      success: true, 
      requestId,
      message: "Price access request sent to farmer" 
    });
  } catch (e) {
    console.error('/price-requests error:', e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Get price requests for farmer
app.get('/price-requests', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: "Only farmers can view price requests" });
    }

    const requests = Array.from(priceRequests.values())
      .filter(request => request.farmerEmail === req.user.email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ requests });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Approve/deny price request
app.post('/price-requests/:requestId/respond', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body || {}; // 'approve' or 'deny'
    
    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'deny'" });
    }

    const request = priceRequests.get(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.farmerEmail !== req.user.email) {
      return res.status(403).json({ error: "Not authorized to respond to this request" });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: "Request already responded to" });
    }

    // Update request status
    request.status = action === 'approve' ? 'approved' : 'denied';
    request.respondedAt = new Date().toISOString();
    priceRequests.set(requestId, request);

    // If approved, create permission record
    if (action === 'approve') {
      const permissionKey = `${request.batchId}_${request.requesterEmail}`;
      pricePermissions.set(permissionKey, {
        batchId: request.batchId,
        requesterEmail: request.requesterEmail,
        farmerEmail: req.user.email,
        granted: true,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({ 
      success: true, 
      message: `Request ${action}d successfully` 
    });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Set produce price visibility
app.post('/produce/:batchId/visibility', requireAuth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { visibility } = req.body || {}; // 'public' or 'private'
    
    const batchIdNum = Number(batchId);
    if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
      return res.status(400).json({ error: "Invalid batchId" });
    }

    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ error: "Visibility must be 'public' or 'private'" });
    }

    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: "Only farmers can set price visibility" });
    }

    // Verify farmer owns this batch (simplified check)
    const db = readBatches();
    const batch = db.batches[String(batchIdNum)];
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Store visibility setting
    produceSettings.set(batchIdNum, {
      priceVisibility: visibility,
      farmerEmail: req.user.email
    });

    return res.json({ 
      success: true, 
      message: `Price visibility set to ${visibility}` 
    });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Get produce visibility settings for farmer
app.get('/produce/visibility', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: "Only farmers can view visibility settings" });
    }

    const settings = [];
    for (const [batchId, setting] of produceSettings.entries()) {
      if (setting.farmerEmail === req.user.email) {
        settings.push({
          batchId,
          priceVisibility: setting.priceVisibility
        });
      }
    }

    return res.json({ settings });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Get user's price request status for a batch
app.get('/price-requests/status/:batchId', requireAuth, (req, res) => {
  try {
    const { batchId } = req.params;
    const batchIdNum = Number(batchId);
    
    if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
      return res.status(400).json({ error: "Invalid batchId" });
    }

    // Find request for this user and batch
    let userRequest = null;
    for (const [id, request] of priceRequests.entries()) {
      if (request.batchId === batchIdNum && request.requesterEmail === req.user.email) {
        userRequest = request;
        break;
      }
    }

    // Check if user has permission
    const permissionKey = `${batchIdNum}_${req.user.email}`;
    const hasPermission = pricePermissions.has(permissionKey);

    return res.json({
      hasRequest: !!userRequest,
      requestStatus: userRequest?.status || null,
      hasPermission,
      canViewPrice: hasPermission || req.user.role === 'farmer'
    });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Invalid JSON body handling
app.use((err, _req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Malformed JSON" });
  }
  return next(err);
});

// ---- Helpers
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

function safeJson(res, data) {
  return res
    .type("application/json")
    .send(
      JSON.stringify(
        data,
        (_k, v) => (typeof v === "bigint" ? v.toString() : v)
      )
    );
}

function mapErrorToHttp(e) {
  const message = String(e?.shortMessage || e?.message || e);
  // Surface revert reasons if present
  if (e && e.cause && e.cause.name === "ContractFunctionRevertedError") {
    const reason = e.cause?.revert?.reason || e.cause?.reason || message;
    return { code: 400, body: { error: String(reason) } };
  }
  if (message.includes("Invalid address") || message.includes("invalid") && message.includes("address")) {
    return { code: 400, body: { error: message } };
  }
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("HTTP request failed")
  ) {
    return { code: 503, body: { error: "Node RPC unavailable", details: message } };
  }
  return { code: 500, body: { error: message } };
}

// ---- Chain & clients
const hardhatChain = defineChain({
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  rpcUrls: { default: { http: [RPC_URL] } },
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
});

const publicClient = createPublicClient({
  chain: hardhatChain,
  transport: http(RPC_URL, { timeout: 15_000 }),
});

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: hardhatChain,
  transport: http(RPC_URL, { timeout: 15_000 }),
});

// ---- Contract artifacts
const deployed = JSON.parse(
  fs.readFileSync("./ignition/deployments/chain-31337/deployed_addresses.json", "utf-8")
);
const contractAddress = deployed["SupplyChainModule#SupplyChain"];
const abi = JSON.parse(
  fs.readFileSync(
    "./ignition/deployments/chain-31337/artifacts/SupplyChainModule#SupplyChain.json",
    "utf-8"
  )
).abi;

// ---- Audit log setup
const auditDir = path.join(process.cwd(), "logs");
try { if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir); } catch {}
const auditPath = path.join(auditDir, "audit.log");
function audit(event, data) {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + "\n";
    fs.appendFile(auditPath, line, () => {});
  } catch {}
}

// ---- Lightweight JSON persistence for batches
const dataDir = path.join(process.cwd(), "data");
const batchesPath = path.join(dataDir, "batches.json");
function ensureDataStore() {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir); } catch {}
  try { if (!fs.existsSync(batchesPath)) fs.writeFileSync(batchesPath, JSON.stringify({ batches: {} }, null, 2)); } catch {}
}
function readBatches() {
  try {
    ensureDataStore();
    const raw = fs.readFileSync(batchesPath, "utf-8");
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object" && parsed.batches) ? parsed : { batches: {} };
  } catch {
    return { batches: {} };
  }
}
function writeBatch(batchId, record) {
  try {
    const db = readBatches();
    db.batches[String(batchId)] = { ...record, batchId };
    fs.writeFileSync(batchesPath, JSON.stringify(db, null, 2));
  } catch {}
}

// ---- List Batches (for dashboards)
app.get("/batches", async (_req, res) => {
  try {
    const db = readBatches();
    const items = Object.values(db.batches)
      .sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return safeJson(res, { items });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Health endpoint
app.get("/health", async (_req, res) => {
  try {
    const chainId = await publicClient.getChainId();
    return safeJson(res, { ok: true, chainId, contractAddress });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Simple rate limits for write endpoints
const writeLimiter = rateLimit({ windowMs: 60_000, max: 30 });

// API key or session auth for write endpoints
const API_KEY = process.env.API_KEY || "dev-api-key";
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key && String(key) === API_KEY) return next();
  return res.status(401).json({ error: "Unauthorized" });
}
function requireApiKeyOrSession(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key && String(key) === API_KEY) return next();
  // else allow authenticated session
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (sid && sessions.has(sid)) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ---- Add Produce
app.post("/produce", requireApiKeyOrSession, writeLimiter, async (req, res) => {
  try {
    // Enforce JSON Content-Type
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const { cropName, quantity, harvestDate } = req.body ?? {};

    if (typeof cropName !== "string" || cropName.trim().length === 0) {
      return res.status(400).json({ error: "Invalid cropName" });
    }
    const qtyNum = typeof quantity === "string" ? Number(quantity) : quantity;
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    if (typeof harvestDate !== "string" || harvestDate.trim().length === 0) {
      return res.status(400).json({ error: "Invalid harvestDate" });
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "addProduce",
      args: [cropName.trim(), BigInt(qtyNum), harvestDate.trim()],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const nextId = await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: "nextBatchId",
    });

    const payload = {
      success: true,
      batchId: Number(nextId) - 1,
      transactionHash: hash,
      blockNumber: receipt.blockNumber == null ? null : Number(receipt.blockNumber),
      qrCodeUrl: `${req.protocol}://${req.get("host")}/qrcode/${Number(nextId) - 1}`,
    };
    audit("produce.add", { from: account.address, ...payload });
    // Persist to lightweight store for quick lookups/UI demos
    writeBatch(payload.batchId, {
      cropName: cropName.trim(),
      quantity: qtyNum,
      harvestDate: harvestDate.trim(),
      farmer: account.address,
      createdAt: new Date().toISOString(),
    });
    return safeJson(res, payload);
  } catch (e) {
    console.error("/produce error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});
// ---- QR Code endpoint
app.get("/qrcode/:id", async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum < 0) {
      return res.status(400).json({ error: "Invalid batch id" });
    }
    const appConsumerUrl = process.env.CONSUMER_URL || "http://localhost:8080/consumer";
    const url = `${appConsumerUrl}?batchId=${idNum}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 256 });
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(svg);
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Faucet endpoint (test ETH)
app.post("/faucet", requireApiKey, writeLimiter, async (req, res) => {
  try {
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const { to, amount } = req.body ?? {};
    if (!isAddress(to)) {
      return res.status(400).json({ error: `Invalid address: ${to}` });
    }
    const amountEth = typeof amount === "string" ? Number(amount) : amount;
    const value = BigInt(Math.floor((Number.isFinite(amountEth) ? amountEth : 1) * 1e18));
    const tx = await walletClient.sendTransaction({ to, value });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    const payload = { success: true, transactionHash: tx, blockNumber: Number(receipt.blockNumber) };
    audit("wallet.faucet", { to, amount: amountEth ?? 1, ...payload });
    return safeJson(res, payload);
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Transfer Ownership
app.post("/transfer", requireApiKeyOrSession, writeLimiter, async (req, res) => {
  try {
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const { batchId, recipient, price } = req.body ?? {};

    const batchIdNum = typeof batchId === "string" ? Number(batchId) : batchId;
    if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
      return res.status(400).json({ error: "Invalid batchId" });
    }
    if (!isAddress(recipient)) {
      return res.status(400).json({ error: `Invalid recipient address: ${recipient}` });
    }
    const priceNum = typeof price === "string" ? Number(price) : price;
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    // Pre-check: ensure batch exists (farmer != address(0))
    try {
      const produceTuple = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getProduce",
        args: [BigInt(batchIdNum)],
      });
      const farmerAddress = Array.isArray(produceTuple) ? produceTuple[3] : undefined;
      if (!farmerAddress || farmerAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
        return res.status(404).json({ error: `Produce ${batchIdNum} not found` });
      }
    } catch (e) {
      const mapped = mapErrorToHttp(e);
      return res.status(mapped.code).json(mapped.body);
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "transferOwnership",
      args: [BigInt(batchIdNum), recipient, BigInt(Math.floor(priceNum * 1e18))],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const payload = {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber == null ? null : Number(receipt.blockNumber),
    };
    audit("produce.transfer", { from: account.address, batchId: batchIdNum, recipient, price: priceNum, ...payload });
    return safeJson(res, payload);
  } catch (e) {
    console.error("/transfer error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Get Produce by batch id
app.get("/getProduce/:id", async (req, res) => {
  try {
    const idStr = req.params.id;
    const idNum = Number(idStr);
    if (!Number.isFinite(idNum) || idNum < 0) {
      return res.status(400).json({ error: "Invalid batch id" });
    }

    const produceAddedEvent = abi.find((x) => x.type === "event" && x.name === "ProduceAdded");
    const transferEvent = abi.find((x) => x.type === "event" && x.name === "OwnershipTransferred");

    const addedLogs = await publicClient.getLogs({
      address: contractAddress,
      events: [produceAddedEvent],
      fromBlock: 0n,
      toBlock: "latest",
    });

    const addedForId = addedLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(idNum));

    if (addedForId.length === 0) {
      return res.status(404).json({ error: "Produce not found" });
    }

    const { cropName, quantity, harvestDate, farmer } = addedForId[0].args;

    const transferLogs = await publicClient.getLogs({
      address: contractAddress,
      events: [transferEvent],
      fromBlock: 0n,
      toBlock: "latest",
    });

    // Enrich transfer logs with block timestamps
    const transfersForId = transferLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(idNum));

    let history = [];
    try {
      history = await Promise.all(transfersForId.map(async (l) => {
        let ts = null;
        try {
          const block = await publicClient.getBlock({ blockHash: l.blockHash });
          // viem returns bigint seconds
          ts = block?.timestamp != null ? Number(block.timestamp) : null;
        } catch {}
        return {
          from: l.args.from,
          to: l.args.to,
          price: Number(l.args.price) / 1e18,
          txHash: l.transactionHash,
          blockNumber: l.blockNumber == null ? null : Number(l.blockNumber),
          blockTimestamp: ts,
        };
      }));
    } catch (e) {
      // Fallback to basic mapping without timestamps
      history = transfersForId.map((l) => ({
        from: l.args.from,
        to: l.args.to,
        price: Number(l.args.price) / 1e18,
        txHash: l.transactionHash,
        blockNumber: l.blockNumber == null ? null : Number(l.blockNumber),
        blockTimestamp: null,
      }));
    }

    // Check price visibility permissions
    const cookies = parseCookies(req);
    const sid = cookies['sid'];
    let currentUser = null;
    
    if (sid && sessions.has(sid)) {
      const email = sessions.get(sid);
      currentUser = users.get(email);
    }

    // Check if prices should be hidden based on visibility settings
    const settings = produceSettings.get(idNum);
    let shouldHidePrices = false;
    
    if (settings && settings.priceVisibility === 'private') {
      // Hide prices unless user is the farmer or has permission
      if (!currentUser) {
        shouldHidePrices = true;
      } else if (currentUser.role === 'farmer' && currentUser.email === settings.farmerEmail) {
        shouldHidePrices = false; // Farmer can always see their own prices
      } else {
        // Check if user has permission
        const permissionKey = `${idNum}_${currentUser.email}`;
        shouldHidePrices = !pricePermissions.has(permissionKey);
      }
    }

    // Filter price information if needed
    if (shouldHidePrices) {
      history = history.map(h => ({
        from: h.from,
        to: h.to,
        price: null, // Hide price
        txHash: h.txHash,
        priceHidden: true
      }));
    }

    const last = history.length > 0 ? history[history.length - 1] : null;
    const response = {
      cropName,
      quantity: Number(quantity),
      harvestDate,
      farmer,
      history,
      priceVisibility: settings?.priceVisibility || 'public',
      pricesHidden: shouldHidePrices,
      lastTransferTo: last?.to || null,
      lastTransferDateISO: last?.blockTimestamp ? new Date(last.blockTimestamp * 1000).toISOString() : null,
    };

    return safeJson(res, response);
  } catch (e) {
    console.error("/getProduce/:id error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ error: "Not found", path: req.path });
});

// Centralized error handler
// Note: Express 5 passes errors here
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const mapped = mapErrorToHttp(err);
  return res.status(mapped.code).json(mapped.body);
});

// ---- Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
// Graceful shutdown
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`Received ${sig}. Shutting down API.`);
    process.exit(0);
  });
}
// --- ROBUST API END ---