# Playwright MCP Test Plan

> Converted from 7 native Playwright spec files (199 tests) into step-by-step instructions
> for execution via Playwright MCP browsers (admin, seller1, seller2, bidder1, bidder2).
>
> **Base URL**: `http://localhost:3000`
> **API Base**: `https://api.newlsun.com`

---

## Test Accounts (to be configured with real credentials)

| Browser | Role | Credentials | Notes |
|---------|------|-------------|-------|
| `playwright-admin` | Admin | TBD | Full admin access |
| `playwright-seller1` | Seller | TBD | Can create items + auctions |
| `playwright-seller2` | Seller | TBD | Second seller for cross-seller tests |
| `playwright-bidder1` | Bidder | TBD | Primary bidder |
| `playwright-bidder2` | Bidder | TBD | Competing bidder |

---

## 1. Public Pages (No Login Required)

**Use any browser. No authentication needed.**

### 1.1 Home Page — Hero Section
1. Navigate to `/`
2. **Verify**: Page title is "Bid System v1.0"
3. **Verify**: Hero heading contains "Premier Marketplace"
4. **Verify**: "Browse Auctions" button visible
5. **Verify**: "Start Selling" button visible
6. **Verify**: Stats section visible ($24M+, 8,400+, 99.8%)

### 1.2 Home Page — Featured Auctions
1. Navigate to `/`
2. **Verify**: "Featured Auctions" heading visible
3. **Verify**: "View All" button visible

### 1.3 Browse Page
1. Navigate to `/browse`
2. **Verify**: URL is `/browse`
3. **Verify**: Page loads without errors

### 1.4 Login Page — Form Elements
1. Navigate to `/login`
2. **Verify**: Email input with placeholder "you@example.com" visible
3. **Verify**: Password input (type=password) visible
4. **Verify**: Submit button visible
5. **Verify**: Register link visible

### 1.5 Navigation: Home → Browse
1. Navigate to `/`
2. Click "Browse Auctions" button
3. **Verify**: URL changed to `/browse`

### 1.6 Navigation: Login → Register
1. Navigate to `/login`
2. Click register link
3. **Verify**: URL changed to `/register`

### 1.7 404 Page
1. Navigate to `/this-page-does-not-exist`
2. **Verify**: "404" text visible

### 1.8 Protected Route Redirect
1. Navigate to `/dashboard` (while NOT logged in)
2. **Verify**: Redirected to `/login`

---

## 2. Authentication Flows

### 2A. Login Form Validation

**Browser**: Any (not logged in)

#### 2A.1 Empty Form Submit
1. Navigate to `/login`
2. Click submit button without filling fields
3. **Verify**: Validation error message appears

#### 2A.2 Empty Account Field
1. Navigate to `/login`
2. Fill only password field with "somepassword"
3. Click submit
4. **Verify**: Account field shows required error

#### 2A.3 Empty Password Field
1. Navigate to `/login`
2. Fill only email with "test@oio.vn"
3. Click submit
4. **Verify**: Password field shows required error

#### 2A.4 Email Input Accepts Text
1. Navigate to `/login`
2. **Verify**: Email input has placeholder "you@example.com"
3. Type "test@example.com"
4. **Verify**: Input value is "test@example.com"

#### 2A.5 Password Is Masked
1. Navigate to `/login`
2. **Verify**: Password input has type="password"

#### 2A.6 Password Visibility Toggle
1. Navigate to `/login`
2. Type "mypassword" in password field
3. **Verify**: Input type is "password" (masked)
4. Click the eye icon
5. **Verify**: Input type changed to "text" (visible)

#### 2A.7 Social Login Buttons
1. Navigate to `/login`
2. **Verify**: Google social login button visible
3. **Verify**: GitHub social login button visible

### 2B. Login Error Handling

#### 2B.1 Invalid Credentials (401)
1. Navigate to `/login`
2. Enter wrong email + password
3. Click submit
4. **Verify**: Error message appears (toast/notification)

#### 2B.2 Email Not Confirmed (403)
1. Navigate to `/login`
2. Enter email of unconfirmed account + password
3. Click submit
4. **Verify**: Error message appears

#### 2B.3 Server Error (500)
1. Navigate to `/login`
2. Submit login (when server is down)
3. **Verify**: Error message appears, page doesn't crash

#### 2B.4 Loading State
1. Navigate to `/login`
2. Fill valid credentials
3. Click submit
4. **Verify**: Button shows loading spinner during request

### 2C. Login Success

#### 2C.1 Successful Login Redirects to Dashboard
1. Navigate to `/login`
2. Enter valid credentials
3. Click submit
4. **Verify**: Redirected to `/dashboard`

#### 2C.2 Tokens Stored in localStorage
1. After successful login
2. **Verify**: `accessToken` exists in localStorage
3. **Verify**: `refreshToken` exists in localStorage
4. **Verify**: `user` exists in localStorage

#### 2C.3 Redirect URL Preserved
1. Navigate to `/my-bids` (not logged in → redirected to `/login`)
2. Log in with valid credentials
3. **Verify**: Redirected back to `/my-bids` (not `/dashboard`)

### 2D. Registration Form Validation

#### 2D.1 Username Required
1. Navigate to `/register`
2. Leave username empty, fill other fields
3. Click submit
4. **Verify**: Validation error shown

#### 2D.2 Email Format Validation
1. Navigate to `/register`
2. Enter "not-an-email" in email field
3. Click submit
4. **Verify**: Email format error shown

#### 2D.3 Password Minimum Length
1. Navigate to `/register`
2. Enter "short" in password field
3. Click submit
4. **Verify**: Password length error shown

#### 2D.4 Password Confirmation Match
1. Navigate to `/register`
2. Enter "password123" in password field
3. Enter "differentpassword" in confirm password
4. Click submit
5. **Verify**: Passwords don't match error shown

#### 2D.5 Successful Registration
1. Navigate to `/register`
2. Fill all fields correctly (username, email, password, confirm password)
3. Click submit
4. **Verify**: Success alert appears (green)

### 2E. Registration Error Handling

#### 2E.1 Email Already Taken (409)
1. Navigate to `/register`
2. Fill form with an already-registered email
3. Click submit
4. **Verify**: Error about email taken

#### 2E.2 Username Already Taken (409)
1. Navigate to `/register`
2. Fill form with an already-taken username
3. Click submit
4. **Verify**: Error about username taken

### 2F. Protected Routes

All these routes should redirect to `/login` when not authenticated:
- `/dashboard`
- `/wallet`
- `/my-bids`
- `/my-listings`
- `/create-auction`
- `/orders`
- `/profile`

**Test each**: Navigate → Verify redirect to `/login`

### 2G. Role-Based Access

#### 2G.1 Regular User Cannot Access /moderator
1. Log in as a regular bidder (bidder1)
2. Navigate to `/moderator`
3. **Verify**: 403 result page shown

#### 2G.2 Regular User Cannot Access /admin
1. Log in as a regular bidder (bidder1)
2. Navigate to `/admin`
3. **Verify**: 403 result page shown

---

## 3. Dashboard & Wallet (Authenticated)

### 3A. Dashboard

**Browser**: Any logged-in user

#### 3A.1 Dashboard Loads
1. Navigate to `/dashboard`
2. **Verify**: Page heading visible
3. **Verify**: At least one card component rendered

#### 3A.2 Wallet Summary Card
1. Navigate to `/dashboard`
2. **Verify**: Wallet balance card visible

#### 3A.3 Active Bids Section
1. Navigate to `/dashboard`
2. **Verify**: Active bids table or cards visible

#### 3A.4 Wallet Link
1. Navigate to `/dashboard`
2. **Verify**: Link/button to wallet page exists

#### 3A.5 Recommended Auctions
1. Navigate to `/dashboard`
2. **Verify**: Recommended auctions section rendered

### 3B. Wallet

#### 3B.1 Balance Overview
1. Navigate to `/wallet`
2. **Verify**: Balance amounts displayed
3. **Verify**: Available, locked, held, refund balances shown

#### 3B.2 Add Funds Modal
1. Navigate to `/wallet`
2. Click "Add Funds" / "Nạp tiền" button
3. **Verify**: Modal opens

#### 3B.3 Withdraw Modal
1. Navigate to `/wallet`
2. Click "Withdraw" / "Rút tiền" button
3. **Verify**: Modal opens

#### 3B.4 Transaction History
1. Navigate to `/wallet`
2. **Verify**: "Transaction History" section visible

#### 3B.5 Empty Wallet
1. (With new account / zero balance)
2. Navigate to `/wallet`
3. **Verify**: Zero balances displayed correctly

---

## 4. My Bids (Authenticated)

**Browser**: bidder1 or bidder2

### 4.1 Tab Switcher
1. Navigate to `/my-bids`
2. **Verify**: Tab switcher visible (Active, Ended, Watching)

### 4.2 Active Tab Content
1. Navigate to `/my-bids`
2. **Verify**: Active tab shows bid items or empty state

### 4.3 Tab Switching
1. Navigate to `/my-bids`
2. Click "Ended" tab
3. **Verify**: Content changes to ended bids

### 4.4 View Mode Toggle
1. Navigate to `/my-bids`
2. **Verify**: View toggle (table/card) is present

### 4.5 Empty State
1. Navigate to `/my-bids` (with account that has no bids)
2. **Verify**: Empty state shown with "Browse" CTA

---

## 5. Orders (Authenticated)

### 5.1 Tab Switcher
1. Navigate to `/orders`
2. **Verify**: Tab switcher (Active, Completed, Cancelled)

### 5.2 Active Orders
1. Navigate to `/orders`
2. **Verify**: Page heading visible, order list renders

### 5.3 View Mode Toggle
1. Navigate to `/orders`
2. **Verify**: View toggle exists

### 5.4 Empty State
1. Navigate to `/orders` (no orders)
2. **Verify**: Page renders without crash

---

## 6. Profile (Authenticated)

### 6.1 Tab Switcher
1. Navigate to `/profile`
2. **Verify**: Tabs visible (Info, Addresses, Security, Sessions)

### 6.2 Info Tab
1. Navigate to `/profile`
2. **Verify**: User email or name displayed

### 6.3 Addresses Tab
1. Navigate to `/profile`
2. Click "Addresses" tab
3. **Verify**: Address data or empty state shown

### 6.4 Security Tab
1. Navigate to `/profile`
2. Click "Security" tab
3. **Verify**: Password change section visible

### 6.5 Sessions Tab (Known Bug)
1. Navigate to `/profile`
2. Click "Sessions" tab
3. **Verify**: Page does NOT crash (no "Something Went Wrong")

---

## 7. Bidding Flow (Core)

**Browser**: bidder1 or bidder2

### 7A. Active Auction — Bidding Panel

#### 7A.1 Current Price Display
1. Navigate to `/auction/{id}` (active auction)
2. **Verify**: Current price displayed prominently

#### 7A.2 Auction Info
1. Navigate to `/auction/{id}`
2. **Verify**: Starting price visible
3. **Verify**: Bid increment visible
4. **Verify**: Bid count, view count, watch count visible

#### 7A.3 Anti-Sniping Info
1. Navigate to `/auction/{id}` (with autoExtend enabled)
2. **Verify**: Anti-sniping badge or info visible

#### 7A.4 Deposit Info
1. Navigate to `/auction/{id}`
2. **Verify**: Deposit amount and percentage shown

#### 7A.5 Countdown Timer
1. Navigate to `/auction/{id}`
2. **Verify**: Countdown timer or clock icon visible

### 7B. Bid Form — Input Validation

#### 7B.1 Pre-filled Minimum Bid
1. Navigate to `/auction/{id}`
2. **Verify**: Bid input pre-filled with minimum next bid (current + increment)

#### 7B.2 VND Formatting
1. Navigate to `/auction/{id}`
2. **Verify**: Bid input uses dots as thousand separators (e.g., 15.500.000)

#### 7B.3 Quick-Bid Buttons
1. Navigate to `/auction/{id}`
2. **Verify**: +1x, +2x, +3x increment buttons visible
3. Click +2x button
4. **Verify**: Bid input updates to current + 2 * increment

### 7C. Bid Form — Status Display

#### 7C.1 Winning Status
1. Navigate to `/auction/{id}` (where current user is highest bidder)
2. **Verify**: Green "You are winning" alert visible

#### 7C.2 Outbid Status
1. Navigate to `/auction/{id}` (where current user is NOT highest bidder)
2. **Verify**: Orange/warning "You are outbid" alert visible

### 7D. Bid Confirm Modal

#### 7D.1 Modal Opens
1. Navigate to `/auction/{id}`
2. Click "Place Bid" / "Đặt giá" button
3. **Verify**: Confirmation modal appears
4. **Verify**: Bid details displayed (Descriptions component)

#### 7D.2 Item Title in Modal
1. Open bid confirm modal
2. **Verify**: Item title shown in modal

#### 7D.3 Bid Amount Highlighted
1. Open bid confirm modal
2. **Verify**: Your bid amount shown (in blue)

#### 7D.4 Increase Amount
1. Open bid confirm modal
2. **Verify**: Increase amount shown in green

#### 7D.5 High-Value Warning (>= 10M VND)
1. Open bid confirm modal for bid >= 10,000,000 VND
2. **Verify**: Warning alert about high value visible

#### 7D.6 Irreversible Note
1. Open bid confirm modal
2. **Verify**: Info alert about irreversible bid visible

#### 7D.7 Cancel Closes Modal
1. Open bid confirm modal
2. Click Cancel / X button
3. **Verify**: Modal closes
4. **Verify**: No bid was placed

#### 7D.8 No High-Value Warning for Small Bids
1. Open bid confirm modal for bid < 10,000,000 VND
2. **Verify**: No high-value warning shown
3. **Verify**: Irreversible note still shown

### 7E. Bid Confirm — Submit

#### 7E.1 Confirm Places Bid
1. Open bid confirm modal
2. Click Confirm/OK button
3. **Verify**: Success message appears

### 7F. Bid History

#### 7F.1 Bidder Names and Amounts
1. Navigate to `/auction/{id}` (with bids)
2. Scroll to bid history
3. **Verify**: Bidder display names visible
4. **Verify**: Bid amounts visible

#### 7F.2 Winning Badge
1. Navigate to `/auction/{id}`
2. **Verify**: Highest bid has trophy icon or "winning" tag

#### 7F.3 Auto-Bid Badge
1. Navigate to `/auction/{id}` (with auto-bids)
2. **Verify**: Auto-bid entries show thunderbolt icon

#### 7F.4 Empty Bid History
1. Navigate to `/auction/{id}` (no bids yet)
2. **Verify**: "No bids yet" or empty state shown

#### 7F.5 Sealed Auction — Bids Hidden
1. Navigate to sealed auction
2. **Verify**: Lock icon visible
3. **Verify**: Individual bid entries NOT shown

---

## 8. Auction Results (Ended Auctions)

### 8A. Won Auction

**Browser**: The user who won

#### 8A.1 Trophy Icon
1. Navigate to ended auction where current user won
2. **Verify**: Trophy icon visible (gold)

#### 8A.2 Won Title
1. **Verify**: Result title shows win message

#### 8A.3 Final Price
1. **Verify**: Final price displayed

#### 8A.4 Payment Deadline Warning
1. **Verify**: Warning alert about payment deadline

#### 8A.5 Next Steps Guide
1. **Verify**: 3-step guide visible (Pay → Ship → Complete)

#### 8A.6 View Order Button
1. Click "View Order" button
2. **Verify**: Navigated to `/orders`

#### 8A.7 Go to Wallet Button
1. Click "Go to Wallet" button
2. **Verify**: Navigated to `/wallet`

### 8B. Lost Auction

#### 8B.1 Close Circle Icon
1. Navigate to ended auction where current user lost
2. **Verify**: Close circle icon visible (gray)

#### 8B.2 Lost Title
1. **Verify**: Result title shows loss message

### 8C. Cancelled Auction

#### 8C.1 Stop Icon
1. Navigate to cancelled auction
2. **Verify**: Stop icon visible (red)

#### 8C.2 Cancelled Title
1. **Verify**: "Cancelled" title text visible

### 8D. Failed Auction

#### 8D.1 Warning Icon
1. Navigate to failed auction
2. **Verify**: Warning icon visible (amber)

#### 8D.2 Failed Title
1. **Verify**: "Failed" title text visible

#### 8D.3 Failure Reason
1. **Verify**: Failure reason subtitle visible

---

## 9. Seller Features

**Browser**: seller1 or seller2

### 9A. Create Auction Wizard — Step 0 (Select Item)

#### 9A.1 Active Items Only
1. Navigate to `/create-auction`
2. **Verify**: Active items shown (selectable)
3. **Verify**: Draft/in_auction/sold items NOT shown

#### 9A.2 Item Card Details
1. Navigate to `/create-auction`
2. **Verify**: Item image (or placeholder), title, condition tag visible

#### 9A.3 Selection Highlight
1. Navigate to `/create-auction`
2. Click/select an item
3. **Verify**: Selected item highlighted with blue border

#### 9A.4 Next Button Disabled Until Selection
1. Navigate to `/create-auction`
2. **Verify**: "Next" button is disabled
3. Select an item
4. **Verify**: "Next" button becomes enabled

#### 9A.5 Empty State — No Active Items
1. Navigate to `/create-auction` (seller with no active items)
2. **Verify**: Empty state with "Create Item First" button

#### 9A.6 Pre-Selected Item via URL
1. Navigate to `/create-auction/{itemId}`
2. **Verify**: Skips to Step 1 (Settings), step indicator shows step 1 active

### 9B. Create Auction Wizard — Step 1 (Settings)

#### 9B.1 Required Fields Present
1. Navigate to `/create-auction/{itemId}` (goes to step 1)
2. **Verify**: Starting price input visible
3. **Verify**: Bid increment input visible
4. **Verify**: Start time date picker visible
5. **Verify**: End time date picker visible

#### 9B.2 Auto-Extend Toggle Default
1. **Verify**: Auto-extend switch is ON by default

#### 9B.3 Extension Minutes — Visible When Auto-Extend On
1. **Verify**: Extension minutes input visible when auto-extend is on

#### 9B.4 Extension Minutes — Hidden When Auto-Extend Off
1. Toggle auto-extend OFF
2. **Verify**: Extension minutes input disappears

#### 9B.5 Back Button
1. Click "Back" button
2. **Verify**: Returns to Step 0 (Select Item)

#### 9B.6 Date Pickers — Past Dates Disabled
1. Open start time date picker
2. **Verify**: Past dates are disabled

### 9C. Create Auction Wizard — Step 2 (Review)

#### 9C.1 Summary Display
1. Fill Step 1 form with valid data
2. Click "Next"
3. **Verify**: Review page shows all configured values
4. **Verify**: Item title shown

#### 9C.2 Back Button
1. On review step, click "Back"
2. **Verify**: Returns to Step 1 (Settings)

### 9D. Create Auction Wizard — Step 3 (Done)

#### 9D.1 Success State
1. Complete auction creation
2. **Verify**: Success icon and message visible
3. **Verify**: Steps indicator shows 4 steps total

#### 9D.2 Create Another Button
1. On step 3 (done)
2. **Verify**: "Create Another" button exists

### 9E. My Listings — Items Tab

#### 9E.1 Items Table
1. Navigate to `/my-listings`
2. **Verify**: Table visible with item data

#### 9E.2 Status Tags
1. **Verify**: Active items → green tag
2. **Verify**: Draft items → default tag
3. **Verify**: In-auction items → blue tag

#### 9E.3 Create Auction Button Per Active Item
1. **Verify**: "Create Auction" button shown only for active items

#### 9E.4 Create Auction Navigation
1. Click "Create Auction" on an active item
2. **Verify**: Navigated to `/create-auction/{itemId}`

#### 9E.5 Pagination
1. **Verify**: Table shows correct number of rows

### 9F. My Listings — Auctions Tab

#### 9F.1 Tab Switch
1. Navigate to `/my-listings`
2. Click "Auctions" tab
3. **Verify**: Auctions table visible

#### 9F.2 Status Filter
1. On Auctions tab, click status filter dropdown
2. **Verify**: Status options appear

#### 9F.3 Publish Button (Draft Only)
1. **Verify**: "Publish" button shown only for draft auctions

#### 9F.4 View Button Navigation
1. Click "View" on an auction
2. **Verify**: Navigated to `/auction/{id}`

### 9G. My Listings — Top Actions

#### 9G.1 New Item Button
1. Navigate to `/my-listings`
2. Click "New Item" button
3. **Verify**: Navigated to `/create-item`

#### 9G.2 New Auction Button
1. Navigate to `/my-listings`
2. Click "New Auction" button
3. **Verify**: Navigated to `/create-auction`

### 9H. Seller Gating

#### 9H.1 Non-Seller on /create-auction
1. Log in as bidder (no seller role) — use bidder1 browser
2. Navigate to `/create-auction`
3. **Verify**: "Become a Seller" prompt shown

#### 9H.2 Non-Seller on /my-listings
1. Log in as bidder — use bidder1 browser
2. Navigate to `/my-listings`
3. **Verify**: "Become a Seller" prompt shown

#### 9H.3 Non-Seller on /create-item
1. Log in as bidder — use bidder1 browser
2. Navigate to `/create-item`
3. **Verify**: Seller gating prompt or redirect

---

## 10. Multi-User Bidding Scenarios

**These tests use MULTIPLE browsers simultaneously.**

### 10A. Idempotency

#### 10A.1 Idempotency-Key Header Sent
1. **bidder1**: Navigate to active auction
2. **bidder1**: Place a bid (click bid → confirm)
3. **Verify**: Network request includes `Idempotency-Key` header (UUID format)

#### 10A.2 Unique Keys Per Bid
1. **bidder1**: Place bid #1
2. **bidder1**: Place bid #2
3. **Verify**: Two different Idempotency-Key values used

#### 10A.3 Sealed Bid Idempotency
1. **bidder1**: Navigate to sealed auction
2. **bidder1**: Place sealed bid
3. **Verify**: Idempotency-Key header included

### 10B. Outbid Scenario (HIGHEST PRIORITY)

#### 10B.1 Outbid Flow
1. **bidder1**: Navigate to active auction → place bid → is now winning
2. **bidder2**: Navigate to same auction → place HIGHER bid
3. **bidder1**: Refresh page
4. **Verify (bidder1)**: Now shows "outbid" warning (orange)
5. **Verify (bidder2)**: Shows "winning" status (green)

### 10C. Multiple Bidders in History

#### 10C.1 All Bids Visible
1. **bidder1**: Navigate to auction with multiple bidders
2. Scroll to bid history
3. **Verify**: All bidder names visible
4. **Verify**: All bid amounts visible
5. **Verify**: Winning bid has trophy, others don't

### 10D. Concurrent Viewing

#### 10D.1 Two Users Same Auction
1. **bidder1**: Navigate to `/auction/{id}`
2. **bidder2**: Navigate to same `/auction/{id}`
3. **Verify (both)**: Item title visible
4. **Verify (both)**: No error boundary

### 10E. Bid Race — 409 Conflict

#### 10E.1 Conflict Handling
1. **bidder1**: Place bid on auction
2. If server returns 409 (someone bid first)
3. **Verify**: Error message shown
4. **Verify**: Page does NOT crash

### 10F. Validation & Edge Cases

#### 10F.1 Bid on Ended Auction
1. Navigate to ended/sold auction
2. **Verify**: Bid button disabled or absent

#### 10F.2 Seller on Own Auction
1. **seller1**: Navigate to own auction
2. **Verify**: Page renders without crash
3. **Note**: FE currently shows bid form (known gap — BE blocks it)

#### 10F.3 Cancel Does Not Place Bid
1. Click bid button → modal opens
2. Click Cancel
3. **Verify**: Modal closes
4. **Verify**: No POST request sent to bids endpoint

#### 10F.4 Double-Submit Prevention
1. Click bid button → modal opens
2. Click Confirm
3. **Verify**: Button shows loading/disabled during request
4. **Verify**: Cannot click again while in-flight

#### 10F.5 API Error — No Crash
1. Navigate to auction page when API returns 500
2. **Verify**: Page does NOT show "Something Went Wrong" error boundary

---

## 11. Error States (Authenticated)

### 11.1 Dashboard — API 500
1. Navigate to `/dashboard` when APIs fail
2. **Verify**: Page renders (heading visible), no crash

### 11.2 Wallet — API 500
1. Navigate to `/wallet` when APIs fail
2. **Verify**: Page renders, no crash

### 11.3 API Timeout
1. Navigate to `/dashboard` when APIs timeout
2. **Verify**: Not a blank page, no crash

### 11.4 Empty My Bids
1. Navigate to `/my-bids` (no bid data)
2. **Verify**: Page renders with heading, empty state

### 11.5 Empty Orders
1. Navigate to `/orders` (no order data)
2. **Verify**: Page renders with heading, no crash

---

## Execution Notes

### How to Verify with MCP
- **Visible check**: Take snapshot (`browser_snapshot`) and look for the element in the accessibility tree
- **URL check**: After navigation, take snapshot — URL shown in page metadata
- **Not visible check**: Take snapshot and confirm element is NOT in the tree
- **Click**: Use `browser_click` with the element's `ref` from snapshot
- **Type**: Use `browser_fill_form` or `browser_type`
- **Navigate**: Use `browser_navigate`

### Test Priority
1. **P0 (Critical)**: Sections 1, 2C, 7D, 7E, 10B (login, bidding, outbid)
2. **P1 (High)**: Sections 2A, 2F, 3, 7A-C, 7F, 9A-D, 10D-F
3. **P2 (Medium)**: Sections 2B, 2D-E, 2G, 4-6, 8, 9E-H, 10A, 10C, 11

### Known Issues
- **Profile Sessions tab**: May crash with "Something Went Wrong" (known bug)
- **Seller bid on own auction**: FE doesn't block it — BE returns 403
- **Wallet/Dashboard**: Some services use in-app mocks, not real API
