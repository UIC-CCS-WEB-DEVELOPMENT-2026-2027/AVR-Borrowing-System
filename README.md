# AVR Borrowing System

The AVR Borrowing System is a React web application for the University of the Immaculate Conception media center. It provides a borrowing portal for students and equipment, pickup, return, notification, and history tools for AVR staff. The current application is a front-end demo; its data is not shared between browsers or devices.

## Roles

- **Student** — browse available equipment, reserve an item, view a pickup code, cancel a reservation, and review personal borrowing history.
- **Staff** — manage equipment, review pickup reservations, release equipment, process returns with condition notes, and view borrowing records and notifications.
- **Admin** — currently has the staff page access defined by the route guards. Admin account creation and separate admin management pages are not implemented.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal. To create a production build:

```sh
npm run build
```

The repository also provides `npm run lint` to run ESLint.

### Demo staff account

**Demo only — do not use these credentials for a real or production account.**

- Email: `staff@uic.edu.ph`
- Password: `AVRstaff2026!`

The app provisions this demo staff account in browser storage. Production use requires a real backend and secure server-managed authentication; see [the backend plan](./docs/BACKEND_PLAN.md).

## Borrowing flow

1. A student registers with a `@uic.edu.ph` email address and signs in.
2. The student starts a request, enters their student ID manually (camera scanning is a placeholder), chooses available equipment, and specifies a return time and room.
3. A valid request reserves the equipment and displays a pickup code and QR code. The QR encodes only the loan ID.
4. AVR staff enter or scan the pickup code on the Pickups page, then release the item to mark it checked out.
5. Students return equipment to the AVR desk. Staff check it in and record its condition; items with reported issues are moved to Maintenance.
6. Students can review their current borrowings and history. Staff can manage inventory, view all history, and review notifications.

Borrowing rules in the demo include a maximum of three active loans per student, a minimum 15-minute lead time, a maximum seven-day loan period, and return times during the AVR desk's 8:00 AM–5:00 PM hours.

## Project structure

```text
.
├── docs/
│   └── BACKEND_PLAN.md       # Proposed cross-device backend and migration plan
├── src/
│   ├── assets/               # Images and bundled assets
│   ├── components/
│   │   └── ui/               # Reusable shadcn-style UI components
│   ├── context/              # Authentication and borrowing state/providers
│   ├── lib/                  # Shared utilities and borrowing rules
│   ├── pages/                # Student, staff, login, and shared page views
│   ├── App.jsx               # Routes and role-protected page composition
│   ├── App.css               # Application component styles
│   └── main.jsx              # React and router entry point
├── index.html
├── package.json
└── vite.config.js
```

## Known limitations

- This is a browser-only demo, not a multi-user backend. Authentication accounts and sessions are stored in `localStorage`; borrowing state is stored in `sessionStorage`. Data is not synchronized across devices, browsers, or user sessions.
- Client-side roles and browser storage are not a security boundary. The demo password hashing and staff account are not suitable for production authentication.
- The [backend plan](./docs/BACKEND_PLAN.md) describes proposed server-side authentication, shared PostgreSQL data, role enforcement, scheduled jobs, and a gradual migration that preserves the context API used by the pages.
- Student ID scanning is not implemented. Pickup QR scanning requires a supported browser and camera permission, and camera access is available only on HTTPS or `localhost`.
- Overdue status is derived in the UI, notifications are browser-stored, and reservation expiry uses an active-session timer. None are reliable scheduled services while the app is closed.
