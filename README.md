# AVR Borrowing System

A web-based equipment borrowing system for the AVR (Audio-Visual Resources) desk of the University of the Immaculate Conception. The application supports student equipment requests, staff processing, inventory visibility, borrowing history, and notifications in a single browser-based workflow.

## Overview

The AVR Borrowing System is designed to simplify how students borrow AV equipment and how staff manage equipment availability, pick-ups, returns, and overdue follow-up. It includes role-based screens for students and staff, simulated equipment inventory, reservation validation, and a timeline of borrowing activity that is stored in browser state for demo purposes.

This project is a front-end prototype intended to model the borrowing lifecycle and demonstrate how the workflow could function in a university media center. It does not currently connect to a shared multi-user backend or database.

## Goals

- Provide a simple and clear borrowing experience for students.
- Help AVR staff manage active loans, pickups, returns, and inventory.
- Enforce borrowing rules in the client for demo validation.
- Showcase a complete borrowing flow from request to return.
- Act as a foundation for a future full-stack implementation.

## Features

### Student features

- sign in with a demo account or registration flow
- view available equipment and borrowing status
- submit a borrowing request with equipment, room, and return time
- enter student details manually or use the placeholder ID verification flow
- receive a pickup code and QR code after a reservation is created
- cancel active reservations when needed
- review borrowing history and current active loans

### Staff features

- staff dashboard with operational metrics
- review reserved items awaiting pickup
- release equipment to confirm checkout
- record return condition and staff notes
- update equipment status after inspection
- review overdue loans and notifications
- track borrowing history across all transactions

### Demo business rules

The application enforces several front-end-only borrowing rules:

- maximum of three active loans per student
- minimum 15-minute lead time before pickup
- maximum seven-day loan period
- return windows aligned with AVR desk hours
- only one active loan per equipment item at a time

## Roles

- Student — browse equipment, request items, view pickup codes, and review personal borrowing history.
- Staff — manage pickups, releases, returns, inventory, and overdue follow-up.
- Admin — currently shares the staff access pattern via route guards, but a dedicated admin management page is not implemented.

## Borrowing workflow

1. A student registers or signs in with a `@uic.edu.ph` email.
2. The student enters a student ID or school email and begins a borrowing request.
3. The student selects an available equipment item and sets the expected return time and room.
4. The request is validated against the demo rules and stored in browser state.
5. The borrower receives a pickup code and QR code for the loan.
6. Staff review the pickup request, verify the code, and release the item.
7. The borrower returns the equipment at the AVR desk.
8. Staff record the return condition and notes, then check the item back in.
9. Borrowing history and notifications are updated in the app.

## Tech stack

- React 19
- Vite
- React Router DOM
- Tailwind CSS
- shadcn-style UI components
- Lucide React icons
- HTML5 QR support for browser scanning flows
- localStorage/sessionStorage for demo persistence

## Project structure

```text
.
├── docs/
│   └── BACKEND_PLAN.md       # Proposed backend and migration strategy
├── public/                   # Static app assets
├── src/
│   ├── assets/               # Images and bundled assets
│   ├── components/
│   │   └── ui/               # Reusable shadcn-style UI components
│   ├── context/              # Authentication and borrowing state providers
│   ├── lib/                  # Shared utilities and borrowing rules
│   ├── pages/                # Student, staff, login, and shared page views
│   ├── App.css               # Application styles
│   ├── App.jsx               # Routes and role-protected page composition
│   ├── main.jsx              # React and router entry point
│   └── ...
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── jsconfig.json
├── components.json
├── README.md
└── .gitignore
```

## Getting started

### Requirements

- Node.js 18+ or later
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

### Production build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Demo credentials

This application includes a demo staff account for testing the staff flow.

Warning: this is for demo use only. Do not use these credentials in a real or production environment.

- Email: `staff@uic.edu.ph`
- Password: `AVRstaff2026!`

The app stores authentication and borrowing data in browser storage. This makes it easy to prototype the UI locally, but it is not secure or shared across devices.

## Data and storage behavior

This project currently uses browser storage for persistence because it is a front-end prototype. The app stores:

- authentication state in `localStorage`
- borrowing state in `sessionStorage`

This design is convenient for local demos but means the data is not synchronized across browsers, devices, or user sessions.

## Known limitations

This project is a browser-only prototype and not a production system. Important limitations include:

- authentication data is stored in browser storage and is not secure for real deployment
- borrowing data is not shared across browsers, devices, or users
- roles and permissions are enforced only on the client side
- student ID scanning is not implemented in a production-ready way
- QR scanning depends on browser camera support and secure context
- overdue detection and notifications are derived in the UI rather than by a real scheduled backend service
- there is no real database, API layer, or email system

## Backend roadmap

A future production-ready version should move the app to a shared backend with secure authentication, persistent storage, role enforcement, and scheduled jobs. A detailed proposal is included in [docs/BACKEND_PLAN.md](./docs/BACKEND_PLAN.md).

That plan discusses:

- PostgreSQL schema design
- secure auth and role checks
- loan lifecycle and equipment status tracking
- automated overdue detection and notifications
- gradual migration from the current browser-only setup

## Recommended usage

This project is best used for:

- UI and workflow demonstration
- academic and capstone presentations
- prototype validation of AVR borrowing operations
- future extension into a full institutional system

## Contributing

This repository is intended for prototype and academic development. If you are extending the app, keep changes focused on the current workflow and preserve the demo architecture unless you are intentionally implementing the backend migration.

## Notes

This README reflects the current implementation state of the project. The app is meant to demonstrate an AVR equipment borrowing workflow and serve as a strong foundation for a future full-stack version.
