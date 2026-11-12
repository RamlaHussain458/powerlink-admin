# PowerLink Admin Panel

The web admin console for **PowerLink**, an equipment rental platform. Admins use it to review and approve equipment providers, manage users, monitor bookings and equipment, and track platform activity. It works alongside the PowerLink Android app and shares the same Firebase project.

## Features

- **Secure admin login.** Only accounts with the `admin` role can sign in. Sessions end when the browser tab is closed, and after 30 minutes of inactivity.
- **Dashboard.** Total users and providers, pending approvals, revenue for the month, a 30 day bookings chart and the latest bookings.
- **Provider management.** Search and filter providers, approve or suspend them (one at a time or in bulk), view their equipment, and delete accounts.
- **Verification documents.** Providers upload proof of their business when they register. Admins open the files from the Providers page and review them before approving.
- **User management.** Search users, view their bookings, and delete accounts. A clean-up tool removes profiles whose login no longer exists in Firebase Authentication.
- **Bookings.** Filter by status, payment, provider and date range, with a detail view for each booking.
- **Equipment.** Browse every item listed across all providers, toggle availability, or remove items.
- **Analytics.** Monthly revenue, bookings by status, top providers and most booked equipment.
- **Settings.** Change the admin password.

## Tech Stack

- React 19 with React Router
- Vite
- Tailwind CSS
- Recharts
- Firebase (Authentication, Firestore, Storage, Cloud Functions)

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A Firebase project that the PowerLink Android app also uses
- An admin account: a Firebase Authentication user whose document in the `users` collection has `role: "admin"`

### Installation

```bash
git clone https://github.com/RamlaHussain458/powerlink-admin.git
cd powerlink-admin
npm install
```

### Environment variables

Create a `.env` file in the project root with your Firebase web app settings:

```
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
VITE_MEASUREMENT_ID=
```

These values are in the Firebase console under Project settings, then Your apps. Never commit the `.env` file.

### Run locally

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview
```

## Firebase Setup

The panel expects this data in Firebase.

**Firestore**

| Path | Contents |
|---|---|
| `users/{uid}` | User profiles. The `role` field decides admin access |
| `providers/{uid}` | Provider profiles with a `status` of pending, approved or suspended |
| `providers/{uid}/equipment/{id}` | Equipment listed by a provider |
| `providers/{uid}/documents/{id}` | Verification documents submitted by a provider |
| `bookings/{id}` | Bookings made by users |

**Storage**

- `provider_documents/{uid}/...` holds the verification files.

**Cloud Functions** (in the main PowerLink project)

- `adminDeleteAccount` deletes an account together with its data.
- `cleanupOrphanedAccounts` finds and removes profiles whose Authentication account is gone.
- `onAuthUserDeleted` cleans up automatically when an account is deleted in Firebase Authentication.

Deploy them with `firebase deploy --only functions`. The Delete and clean-up buttons will not work until the functions are deployed.

The panel only hides pages in the browser, so real protection comes from your Firestore and Storage security rules. Make sure those rules restrict reading verification documents to the owner and admins.

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel. Vite is detected automatically.
3. Add every `VITE_...` variable under Settings, then Environment Variables.
4. Deploy. Each push to `main` redeploys the site.

If React Router pages show a 404 after a refresh, add a `vercel.json` with a rewrite to `index.html`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Project Structure

```
src/
  assets/        Logo and images
  components/    Layout and shared UI (modals, tables, badges)
  context/       Authentication and toast notifications
  lib/           Firebase setup
  pages/         Dashboard, Providers, Users, Bookings,
                 Equipment, Analytics, Settings, Login
  App.jsx        Routes and route protection
  main.jsx       App entry point
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Security Notes

- Do not commit `.env` files or admin credentials.
- Keep Firestore and Storage rules strict. The admin role check in the browser is not a substitute for them.
- Verification documents contain personal and business information, so only admins and the owning provider should be able to read them.

## Related

The PowerLink Android app (Java) and its Cloud Functions live in the main PowerLink project and use the same Firebase backend.