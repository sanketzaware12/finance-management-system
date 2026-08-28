# Finora — standalone frontend for your Finance Management System

You now have two folders:

```
finora-frontend/        ← open THIS in VS Code, it's the separate frontend you asked for
  index.html
  app.js
  config.js             ← the ONLY file you edit to change the backend URL
  styles.css

backend-cors-patch/
  SecurityConfig.java    ← drop-in replacement for your existing file (see step 2 below)
```

Same "Finora" theme as your reference project (teal brand color, sidebar nav, sticky
header, glass hero panel on the login screen), same tabs, same API calls — just
packaged as a plain HTML/Tailwind/JS site that lives **outside** the Spring Boot
project so you can open it directly in VS Code, instead of inside
`src/main/resources/static`.

## 1. Why a separate step is needed at all

Your reference frontend called the API with a relative path (`/api/...`) because it
was served by Spring Boot itself on the same origin (`localhost:8080`). The moment
you open `index.html` straight from VS Code (Live Server, or double-clicking the
file), the page is loaded from a **different origin** — e.g. `http://127.0.0.1:5500`
or `file://`. Browsers block cross-origin API calls unless the backend explicitly
allows it (CORS). So two things had to change:

1. The frontend now calls an **absolute** URL, configured in `config.js`.
2. The backend needs a CORS policy — it currently has none at all.

## 2. Add CORS to the backend (one-time, required)

Your current `SecurityConfig.java` has no CORS configuration and no `OPTIONS`
permit rule, so requests from a different origin will fail before they even reach
your controllers.

Replace:
`finance_management_systemBACKEND/src/main/java/com/finance/security/SecurityConfig.java`

with the file in `backend-cors-patch/SecurityConfig.java`. It adds:
- A `CorsConfigurationSource` bean (wildcard origin for local dev — tighten this to
  your real frontend origin before deploying anywhere public).
- `.cors(...)` wired into the security filter chain.
- An explicit `permitAll()` for `OPTIONS` requests (CORS preflight), which your
  original config didn't have — without it every preflight request gets rejected
  by `anyRequest().authenticated()`.

Nothing else in your backend changes. Rebuild/restart the Spring Boot app afterward.

## 3. Run the frontend in VS Code

1. Open the `finora-frontend` folder in VS Code (`File → Open Folder`).
2. Install the **Live Server** extension (or use `npx serve .` / any static file
   server) — don't open `index.html` with `file://`, since `fetch()` behaves
   inconsistently from the file protocol in some browsers.
3. Right-click `index.html` → **Open with Live Server**.
4. If your backend runs somewhere other than `http://localhost:8080`, edit the one
   line in `config.js`:
   ```js
   API_BASE_URL: 'http://localhost:8080/api'
   ```
5. Log in with an existing user from your `users` table (password is stored/compared
   as plain text right now, since `SecurityConfig` uses `NoOpPasswordEncoder` —
   worth switching to `BCryptPasswordEncoder` before this goes anywhere real, but
   that's a separate change from what you asked for here).

## 4. What's covered

Every controller in your backend has a matching tab and matching form fields:

| Tab | Backend endpoint |
|---|---|
| Dashboard | aggregates `/users`, `/savings`, `/transactions`, `/fd`, `/rd`, `/loans` |
| Users (admin only) | `/api/users` |
| Savings Accounts | `/api/savings` |
| Transactions | `/api/transactions` |
| Fixed Deposits | `/api/fd` |
| Recurring Deposits | `/api/rd` |
| Loans (approve/reject/disburse/generate EMI) | `/api/loans` |
| EMI Schedule | `/api/emi-schedules` |
| My Profile | session info only |

## 5. What I changed vs. your reference project

- **API connection**: absolute URL via `config.js` instead of a relative path, plus
  a clearer error toast if the API can't be reached at all (down server, CORS not
  set up yet, wrong port).
- **Placeholders**: every text/number input across every form (login, users, savings,
  transactions, FD, RD, loans) now shows a real example sentence — "Enter your email",
  "Enter loan amount", "Enter interest rate (%)", etc. — instead of being blank.
- **Filters**: every module table now gets a dropdown filter for its status-like
  column (Status for savings/FD/RD/loans/EMI, Type for transactions, Role for users),
  built automatically from whatever values actually exist in your data, in addition
  to the existing free-text search box.
- **Sticky header / responsiveness**: unchanged from your reference — it was already
  correctly built (`sticky top-0` header, collapsible sidebar under `1024px`,
  single-column forms under `640px`, scrollable tables on narrow screens). I kept
  it as-is rather than rebuilding something that already worked.
- **No React** anywhere — plain HTML + Tailwind (via CDN) + vanilla JavaScript, as
  requested.


## Registration flow added

The Sign In page now includes a **Create an account** link. Registration uses the existing
`POST /api/users` endpoint with the `CUSTOMER` role. After a successful registration, the
user is returned to the Sign In screen with the registered email filled in.

The included `SecurityConfig.java` has only one registration-related security change:
`POST /api/users` is permitted without JWT so a new customer can register before signing in.
All other existing routes and frontend modules are unchanged.
