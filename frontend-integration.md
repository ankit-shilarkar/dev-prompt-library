# Frontend Integration Specification
> Generated from: README.md + /graphify output + Sub-Agent A (backend) + Sub-Agent B (frontend) + Sub-Agent C (config) + Sub-Agent D (architecture)
>
> **How to use this file:**
> Give this ENTIRE file to your AI (Claude / ChatGPT) before building any screen.
> Say: *"Read this spec fully first. Now help me build [screen name] that integrates with this backend."*
>
> **Most important section: Section 11 — Hard Constraints.**
> Read it before touching any field name, enum value, or API call.

---

## 1. Project Overview

- **App name:** [filled by scanner]
- **What it does:** [2-3 sentences from README]
- **Platforms:** Web + Android + iOS (React + Expo monorepo)
- **End users:** [filled by scanner]
- **Stage:** MVP / Beta / Production

---

## 2. Tech Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Language | | |
| Framework | | |
| Database | | |
| ORM / Query layer | | |
| Auth library | | |
| Hosting | | |

### Frontend (existing codebase)
| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | |
| Expo SDK | | |
| Navigation | | |
| State management | | |
| Component library | | |
| HTTP client | | |
| Language | TypeScript / JavaScript | |

### All Dependencies (exact versions from package.json)
**Navigation:** [package@version, ...]
**UI:** [package@version, ...]
**State:** [package@version, ...]
**Network:** [package@version, ...]
**Auth:** [package@version, ...]
**Utils:** [package@version, ...]
**Dev:** [package@version, ...]

---

## 3. Project Structure & Architecture

```
/
├── [backend folder]/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
├── [frontend/src folder]/
│   ├── screens/
│   ├── components/
│   ├── navigation/      ← root navigator: [exact file path]
│   ├── hooks/
│   ├── services/        ← API client: [exact file path]
│   └── store/           ← global state: [exact file path]
├── app.json
├── package.json
└── README.md
```

**Data flow:** [plain English from graphify — how API response travels to the screen]

**Core modules (most imported across codebase):**
| File | Purpose |
|---|---|
| [path] | [what it does] |

**Orphan files (not imported anywhere — possible dead code):**
- [list from graphify]

---

## 4. Authentication & Authorization

### End-to-end auth flow
1. User fills login form → app calls `[METHOD] [/exact/endpoint]`
2. Server returns token in field `"[exact field name]"`
3. App saves token to `[AsyncStorage / SecureStore / localStorage]` under key `"[exact key string]"`
4. Every protected request adds header: `Authorization: Bearer {token}`
5. If server returns 401 → [what app does: redirect to Login / attempt refresh / logout]

### Login
- **Endpoint:** `[METHOD] /exact/path`
- **Request body:**
  | Field (exact name) | Type | Required | Validation |
  |---|---|---|---|
  | | | | |
- **Success response:**
  ```json
  { }
  ```
- **Token field name:** `[exact string from response]`
- **Token expiry:** [if found in code]

### Refresh token flow
[Document if exists / Not implemented]

### Logout
- **Endpoint:** [if exists]
- **Frontend must clear:** [storage key(s) to delete]

### Roles & permissions
| Role (exact string in code) | What this user can access |
|---|---|
| | |

### Protected screens (require login)
[List every screen that has an auth guard]

---

## 5. All API Endpoints

---

### `[METHOD]` /exact/path

- **Purpose:** one sentence
- **Auth:** Public / Bearer token required / Role: `[exact role string]`
- **Request body:**
  | Field (exact name) | Type | Required | Validation rules | Example value |
  |---|---|---|---|---|
  | | | | | |
- **URL / Query params:**
  | Param (exact name) | Type | Required | Description |
  |---|---|---|---|
  | | | | |
- **Success response:**
  ```json
  { }
  ```
- **Every response field:**
  | Field | Type | Can be null? | Meaning |
  |---|---|---|---|
  | | | | |
- **Error codes:**
  | Code | When | What to show the user |
  |---|---|---|
  | | | |
- **Currently called from:** [existing frontend file]
- **Integration issues found:** [mismatch between frontend send and backend expect, if any]

---

*(repeat block above for every endpoint)*

---

## 6. Data Models

### [ModelName]
| Field (exact name) | Type | Required | Default | Constraints | Plain English |
|---|---|---|---|---|---|
| | | | | | |

**Relationships:** [e.g. franchise_id → references Franchise._id]
**Indexed fields:** [affects which query params are fast]

---

## 7. Navigation Structure

```
Root Navigator                        [file: exact path]
├── Auth Stack  (not logged in)
│   ├── Login Screen                 [file: exact path]
│   └── Register Screen              [file: exact path]
└── App Stack   (logged in)
    ├── Bottom Tab Navigator
    │   ├── Home Tab                 [file: exact path]
    │   └── Profile Tab              [file: exact path]
    └── Stack screens
        └── Detail Screen            [file: exact path]
```

- **Deep link scheme:** `[from app.json — exact string]`
- **Web routes (Expo Router):** [list file-based routes if applicable]
- **Android back behaviour:** [any custom back handler]

---

## 8. All Screens

---

### [Screen Name]

- **File:** [exact path] / NEW — to be built
- **Route / path:** `[exact route name or URL path]`
- **Platforms:** All / Web only / Mobile only
- **Purpose:** what user does here
- **API calls on load:** [METHOD + exact endpoint]
- **Global state accessed:** [store keys]
- **Components used:** [list]
- **Fields displayed on screen:** [exact API field names in brackets]
- **User actions:**
  | What user does | API called | What happens next |
  |---|---|---|
  | Taps "Submit" | POST /api/... | Navigate to / show toast |
- **States to handle:**
  - Loading → [what to show]
  - Empty → [what to show, suggested copy]
  - Error → [what to show, suggested copy]
- **Current issues:** [broken behaviour / API mismatch in existing screen]

---

*(repeat block above for every screen)*

---

## 9. Forms & Validations

### [Form Name]

- **Submission:** `[METHOD] [/exact/endpoint]`
- **On success:** [navigate to / show toast / refresh list]
- **On validation error:** show `error.details[field_name]` below each input field

| Field (exact API name) | Label shown to user | Input type | Required | Min | Max | Format/Pattern | Error message |
|---|---|---|---|---|---|---|---|
| | text/number/email/tel/date/select/textarea | | | | | | |

---

## 10. Shared Components (Use These — Do Not Rebuild)

### [ComponentName]
- **File:** [exact path]
- **Purpose:** what it renders
- **Props:**
  | Prop name | Type | Required | Default | Description |
  |---|---|---|---|---|
  | | | | | |
- **Platform notes:** [any web vs mobile difference in behaviour]

---

## 11. Hard Constraints — DO NOT DEVIATE

> These are locked by the codebase. Deviating from any of these means the developer has to fix it before launch.

### API field names — use exactly as listed below
The frontend must send these exact names. Do not rename, camelCase, or translate them.
```
[list every field name from request bodies]
```

### Enum values — exact strings, exact case
| Field name | Allowed values — copy exactly |
|---|---|
| status | `"active"`, `"inactive"` |
| [field] | `"[value1]"`, `"[value2]"` |

### Date & time format
- Server sends dates as: `[ISO 8601: 2024-01-15T10:30:00Z / Unix ms]`
- Server expects dates as: `[same]`
- Display to users as: `DD/MM/YYYY HH:mm`

### Required headers on every authenticated request
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Import path aliases — use in all new files
| Alias | Resolves to |
|---|---|
| `@components` | `[path]` |
| `@screens` | `[path]` |
| `@hooks` | `[path]` |
| `@services` | `[path]` |

### Expo / React Native — do not change
- **Expo SDK version:** `[exact]` — do not upgrade without developer sign-off
- **React Native version:** `[exact]`
- **Permissions in app.json:** `[list]` — adding new ones requires a native rebuild
- **Deep link scheme:** `[exact string]` — changing this breaks navigation URLs

### Platform-specific files — maintain all variants
| Base file | .web.js | .android.js | .ios.js | What differs |
|---|---|---|---|---|
| | | | | |

### File uploads
| Field name (exact) | Accepted types | Max size | Endpoint |
|---|---|---|---|
| | | | |

### Environment variables (create `.env` in project root)
```
EXPO_PUBLIC_API_URL=http://localhost:8000
[other vars]
```
For production, update `EXPO_PUBLIC_API_URL` to the live server URL.

---

## 12. Error Handling Contract

### Standard error response shape (returned by all endpoints)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field_name": "field-specific error message"
    }
  }
}
```

### How to display each error in the UI
| HTTP Code | When it happens | What to show |
|---|---|---|
| 400 | Bad data sent | Show `error.details[field]` below each input field inline |
| 401 | Not logged in / token expired | Clear token → navigate to Login screen |
| 403 | No permission | Toast: "You don't have access to this" |
| 404 | Record not found | Inline on screen: "Not found" |
| 409 | Duplicate / conflict | Toast with `error.message` |
| 500 | Server crashed | Toast: "Something went wrong. Please try again." |
| Network error | No internet | Persistent banner: "No internet connection" |

---

## 13. Known Integration Issues

Found by comparing existing frontend code vs backend code:

| Screen / File | Issue description | Backend expects | Frontend currently sends | Fix needed |
|---|---|---|---|---|
| | | | | |

---

## 14. What the New UI Must Preserve

The PM must not remove or redesign these — they are tied to backend behaviour or business logic:

- [Navigation flows that deep links depend on]
- [Specific form field names that the backend validates strictly]
- [Platform-specific UX differences between web and mobile]
- [Any state update flow tied to a real-time sync or background job]

---

## 15. Glossary

Definitions for every technical and business term in this codebase. Written for someone with no coding background.

| Term | Plain English meaning |
|---|---|
| API | A way for the app to get data from the server. Like a waiter who carries your order to the kitchen and brings food back. |
| Endpoint | One specific URL the app calls — like one specific counter at a government office. |
| JWT / Token | A secret code given to you after login. You must show it with every request to prove you are logged in. |
| Bearer token | A way of sending the JWT in a request — you put it in the header as `Authorization: Bearer {your token}`. |
| Request body | The data you send to the server when making an API call — like filling out a form. |
| Response | What the server sends back after the app calls it. |
| Status 200 | Server says: everything worked fine. |
| Status 400 | Server says: you sent something wrong. Check your form fields. |
| Status 401 | Server says: you are not logged in. Go to the login screen. |
| Status 403 | Server says: you are logged in but you don't have permission to do this. |
| Status 500 | Server crashed — not your fault. Show a try-again message. |
| null / undefined | A field with no value. Never assume it has a value — always check and show a dash or placeholder. |
| enum | A field that only accepts a fixed set of text values. The spelling and capitalisation must be exact. |
| Expo | A tool that runs one React codebase on web, Android, and iOS simultaneously. |
| AsyncStorage | A mini-database stored on the user's phone. Used to remember the login token between app restarts. |
| React Navigation | The library controlling which screen the user sees and how they move between screens. |
| Monorepo | One folder that contains both the backend server code and the frontend app code together. |
| Graphify | A Claude Code command (/graphify) that draws a map of how all files in the codebase depend on each other. |
| State | Data the app holds in memory while it is open. It is lost when the app closes unless saved to storage. |
| [domain term] | [plain English meaning specific to this business] |

---

*End of frontend-integration.md*
*Re-run the scanner prompt whenever backend routes, models, or Expo config changes significantly*
*Do not manually edit Sections 5, 6, 11 — they must reflect the actual code*
