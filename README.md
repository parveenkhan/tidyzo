# TidyZo

Home-services MVP: a customer app, an admin desk, and one HTTPS API.

There are three accounts:

- **Service consumer** books a visit in the mobile app.
- **Service provider** signs in on the same app, sees jobs assigned to them, and marks a visit started or completed.
- **Admin** manages services, assigns a provider, and can update any booking.

Consumer login → OTP → choose a service → book a slot and address → the API stores the booking → admin assigns a provider → the provider starts or completes the visit → the consumer gets an in-app alert and, on a device, a local notification.

Razorpay is intentionally not included.

## One repository, three apps

| Folder | What it is |
| --- | --- |
| `mobile` | Expo / React Native customer app |
| `admin` | React admin desk (Vite) |
| `backend` | Node.js API over HTTPS, SQLite database |

Both clients use the same layout as AlarmClockTest: `Assets`, `Component`, `Navigation`, `NetworkController`, `Redux` (actions, reducers, sagas, services, store), `Screens`, and `Utils`. They are separate apps because the admin desk is not a phone screen, and they talk to the same API.

## Run it

Requires Node.js 22 or newer, and Xcode if you want the iOS simulator.

`node_modules`, CocoaPods, the local SQLite file, and the TLS certificate are not in git. Create them after cloning:

```bash
git clone https://github.com/parveenkhan/tidyzo.git
cd tidyzo
cp backend/.env.example backend/.env
npm run cert
npm run install:all
```

`npm run install:all` installs the API, the admin desk, and the mobile app. `npm run cert` writes a local certificate under `certs/`. Do not commit that key.

Start each app in its own terminal, from the repo root:

```bash
npm run backend
```

```bash
npm run admin
```

```bash
npm run mobile
```

What each one opens:

| App | Address | Notes |
| --- | --- | --- |
| API | https://localhost:8443 and http://localhost:8080 | Admin uses HTTPS. The phone and simulator use HTTP on 8080 because they reject the local certificate. |
| Admin desk | http://localhost:5173 | Proxies `/api` to the HTTPS API. |
| Mobile | Expo dev server | Press `i` for the iOS simulator, or run `npm run mobile:web` for the browser. |

The first simulator build compiles the native app, including location. Run it from `mobile` while the API is already up:

```bash
cd mobile
npx expo run:ios --device "iPhone 16 Plus"
```

To watch a consumer and a provider at the same time, build the same app onto a second simulator. Both phones use http://localhost:8080.

```bash
npx expo run:ios --device "iPhone 16"
```

`xcrun simctl list devices available` shows the simulator names. Keep Metro running and reload both apps after it starts.

Demo admin: `admin@tidyzo.app` / `Admin@12345`

Demo providers, after choosing Service provider:

| Mobile | Name | Skill |
| --- | --- | --- |
| 9800000001 | Raju Kumar | Cleaning |
| 9800000002 | Imran Sheikh | Repairs |
| 9800000003 | Neha Singh | Beauty |
| 9800000004 | Arjun Das | Appliance |

The OTP response includes `debugOtp` in development so the flow works without an SMS vendor. The customer app shows that code on the verification screen. Set `ALLOW_DEBUG_OTP=false` outside this demo. Production mode refuses to send it and refuses the default secrets.

## What to click for the demo

1. On one simulator, choose Service consumer, then **Sign up**. Enter a new 10-digit mobile number and a name, then the development code shown on the verify screen. A number that already has an account uses **Sign in** and is not asked for a name again.
2. Open a service. Pick a date, time, and address. **Use current location** can fill the address. Pay with **UPI** or **Card**. TidyZo keeps 15% and the professional receives the rest. Cash is not offered.
3. On the other simulator, choose Service provider and **Sign up** (or **Sign in** with a demo provider below). Set the work city, or use current location, and set the range. Save. Jobs in that range whose category matches the provider skill appear on Home, and the phone shows **New job nearby**.
4. Accept the job, start the visit, then mark it completed. The consumer gets an alert for each of those updates.
5. Admin can still assign a professional from Bookings, or send a custom message from Notifications. A service that already has bookings is hidden instead of erased, so history stays intact.

## Security

- TLS certificate for the API (`certs/`, generated locally, private key not committed). TLS 1.2 minimum.
- Customer JWT is stored in the iOS/Android keychain through Expo SecureStore. The web demo uses `sessionStorage`. It is not written into AsyncStorage.
- Admin JWT stays in `sessionStorage` and is dropped when the tab closes.
- Logout bumps `token_version`, so the previous token stops working.
- Admin passwords are stored with scrypt. OTP codes are stored as HMAC-SHA256, expire in 5 minutes, and lock after 5 wrong attempts.
- SQL uses prepared statements. Request bodies are checked with Zod. Auth and OTP routes are rate-limited. Helmet sets the usual response headers.
- A consumer token can only read and create that person's bookings and notifications. A provider token can only see and update jobs assigned to that provider.
- API errors do not include stack traces. OTP values are not written to logs.
- Firebase Cloud Messaging sends a push when `FIREBASE_SERVICE_ACCOUNT_PATH` points at a service account JSON. Without that file, the notification is still saved and delivered in the app. The customer app also raises a local notification when a new alert arrives.

Copy `backend/.env.example` to `backend/.env` before sharing the machine. Replace `JWT_SECRET` and `OTP_PEPPER`.

## Phone testing

`npm run cert` adds this computer's LAN address to the certificate. On the phone, Expo will call `https://<that-address>:8443`. Install and trust the certificate on the phone, or run the customer app with `npm run mobile:web` on this computer. If the LAN address changes, run `npm run cert` again and restart the API.

## Checks

```bash
npm test
```

That test signs in a consumer, creates a booking, signs in as admin, assigns a provider, then signs in as that provider and starts the visit.
