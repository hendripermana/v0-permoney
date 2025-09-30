# 🌐 Clerk Webhook Setup with Ngrok

**Problem:** Clerk webhooks need publicly accessible URL, but `localhost` is not accessible from internet.

**Solution:** Use Ngrok to create public tunnel to your localhost.

---

## 🎯 QUICK SETUP (5 Minutes)

### **Step 1: Install Ngrok**

**Mac (Homebrew):**
```bash
brew install ngrok
```

**Or Download:**
```
https://ngrok.com/download
```

**Verify Installation:**
```bash
ngrok version
# Should show: ngrok version 3.x.x
```

### **Step 2: Start Development Server**

```bash
cd /Users/p/Project/v0-permoney

# Terminal 1: Redis
redis-server &

# Terminal 2: Dev Server
npm run dev

# Should see: Local: http://localhost:3000
```

### **Step 3: Start Ngrok Tunnel**

**Open new terminal (Terminal 3):**
```bash
ngrok http 3000
```

**You'll see:**
```
ngrok                                                          

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy this URL:** `https://abc123xyz.ngrok.io`

### **Step 4: Configure Clerk Webhook**

1. **Go to Clerk Dashboard:**
   ```
   https://dashboard.clerk.com
   → Webhooks
   → Add Endpoint
   ```

2. **Enter URL:**
   ```
   Endpoint URL: https://abc123xyz.ngrok.io/api/webhooks/clerk
                 ^^^^^^^^^^^^^^^^^^^^^^^^
                 (Your ngrok URL from step 3)
   ```

3. **Subscribe to Events:**
   ```
   ☑ user.created
   ☑ user.updated
   ☑ user.deleted
   ```

4. **Click Create**
   - Should work! ✅
   - No "invalid URL" error

5. **Copy Signing Secret:**
   ```
   After creating, you'll see: Signing Secret
   
   Click "Reveal" and copy: whsec_xxxxxxxxxxxxx
   ```

### **Step 5: Add Secret to .env**

**Edit `/Users/p/Project/v0-permoney/.env`:**
```env
# Add this line:
CLERK_WEBHOOK_SECRET=whsec_your_secret_from_step_4
```

**Restart dev server:**
```bash
# Stop server (Ctrl+C in Terminal 2)
# Start again
npm run dev
```

### **Step 6: Test Webhook**

**In Clerk Dashboard:**
```
1. Go to Webhooks → Your Endpoint
2. Click "Send Test Event"
3. Select "user.created"
4. Click "Send Event"
```

**Check Server Logs:**
```
Should see in Terminal 2:
✅ Clerk webhook received: user.created
✅ User created in database: ...
```

**Check Database:**
```bash
psql -d permoney -c "SELECT id, \"clerkId\", email, name FROM users;"
```

Should see test user! ✅

---

## ✅ DONE! Webhook Active!

Now every time:
- User signs up → Webhook fires → User in DB
- User updates profile → Webhook fires → DB updated
- User deletes account → Webhook fires → User deactivated

---

## 🎯 TESTING THE FULL FLOW

### **Test 1: Sign Up New User**

```
1. Open: https://abc123xyz.ngrok.io
       (Your ngrok URL, NOT localhost!)

2. Click: "Create Account"

3. Sign up with new email

4. Check server logs:
   ✅ Clerk webhook received: user.created
   ✅ User created in database: user_xxxxx

5. Check database:
   psql -d permoney -c "SELECT * FROM users WHERE \"clerkId\" = 'user_xxxxx';"
   
   Should see user! ✅
```

### **Test 2: Login Existing User**

```
1. Go to: https://abc123xyz.ngrok.io

2. Click: "Get Started Now"

3. Login with credentials

4. Should go to onboarding (if first time)
   OR dashboard (if already onboarded)

5. No infinite loop! ✅

6. Dashboard loads with data! ✅
```

---

## 🐛 TROUBLESHOOTING

### **Problem: Ngrok URL changes every restart**

**Solution:** Use ngrok authtoken for stable URLs

```bash
# Sign up at ngrok.com (free)
# Get authtoken from dashboard

# Configure authtoken
ngrok config add-authtoken YOUR_TOKEN

# Now start with custom domain (paid) or use same URL
ngrok http 3000
```

**For development:** Just update Clerk webhook URL when ngrok restarts.

### **Problem: Webhook not firing**

**Check:**

1. **Ngrok is running:**
   ```bash
   # Should show active tunnel
   curl http://127.0.0.1:4040/api/tunnels
   ```

2. **Dev server is running:**
   ```bash
   # Should respond
   curl http://localhost:3000/api/health
   ```

3. **Webhook secret is correct:**
   ```bash
   cat .env | grep CLERK_WEBHOOK_SECRET
   # Should show: CLERK_WEBHOOK_SECRET=whsec_...
   ```

4. **Check Clerk Dashboard:**
   ```
   Webhooks → Your Endpoint → Message Attempts
   Look for errors
   ```

### **Problem: Still getting errors**

**Check ngrok logs:**
```
Open: http://127.0.0.1:4040
(Ngrok web interface)

Shows all requests:
- What Clerk sent
- What your app responded
- Any errors
```

**Check server logs:**
```bash
# In Terminal 2 (dev server)
# Should show:
# - Webhook received
# - User created/updated
# - Any errors
```

---

## 🎨 NGROK WEB INTERFACE

**Super useful for debugging!**

```
Open: http://127.0.0.1:4040

Features:
✅ See all HTTP requests
✅ Inspect request/response
✅ Replay requests
✅ View headers
✅ Check timing
```

**Example:**
```
POST /api/webhooks/clerk  200 OK  150ms

Click to see:
- Request headers (svix-id, svix-signature, etc.)
- Request body (webhook payload)
- Response body
- Any errors
```

---

## 💡 PRO TIPS

### **Tip 1: Keep ngrok running**
```bash
# Use separate terminal for ngrok
# Don't close it while developing
```

### **Tip 2: Bookmark ngrok URL**
```bash
# Your current session URL
echo "https://abc123xyz.ngrok.io"

# Use this for testing
# Share with team if needed
```

### **Tip 3: Test with Clerk Dashboard**
```bash
# Before testing sign-up
# Test webhook first:
Clerk Dashboard → Send Test Event

# Should see in logs:
✅ Webhook received
✅ User created
```

### **Tip 4: Check database after each test**
```bash
# Quick check
psql -d permoney -c "SELECT \"clerkId\", email, name FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"

# See recent users
```

---

## 🚀 PRODUCTION DEPLOYMENT

**When ready for production:**

### **Option 1: Vercel**
```bash
vercel deploy

# Use production URL:
https://your-app.vercel.app/api/webhooks/clerk
```

### **Option 2: Your Server**
```bash
# Use your domain:
https://permoney.yourdomain.com/api/webhooks/clerk
```

### **Update Clerk Webhook:**
```
1. Go to Clerk Dashboard → Webhooks
2. Edit endpoint
3. Change URL to production
4. Save
```

### **Update .env on server:**
```env
# Same webhook secret works!
CLERK_WEBHOOK_SECRET=whsec_your_secret
```

---

## ✅ CHECKLIST

### **Setup Complete When:**
- [x] Ngrok installed
- [x] Ngrok tunnel running
- [x] Dev server running
- [x] Clerk webhook created with ngrok URL
- [x] Webhook secret in .env
- [x] Server restarted
- [x] Test event successful
- [x] User appears in database

### **Ready to Test When:**
- [x] All above complete
- [x] No errors in logs
- [x] Ngrok web interface showing requests
- [x] Database has test user

---

## 🎊 SUCCESS!

**Boss, dengan ngrok:**
✅ Clerk webhook works in development
✅ No deployment needed
✅ Test everything locally
✅ Easy debugging

**Try it now:**
1. Start ngrok: `ngrok http 3000`
2. Copy URL to Clerk webhook
3. Test sign-up!

**Should work perfectly! 🚀**

---

**Questions? Issues? Let me know Boss!** 💪
