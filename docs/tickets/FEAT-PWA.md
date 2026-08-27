# FEAT — Progressive Web App Installation & Mobile Quick Actions

## Summary

Add Progressive Web App (PWA) support to the Shade Library frontend so the deployed application can be installed to a supported phone's Home Screen and launched in a standalone, app-like experience.

The initial PWA implementation should remain a thin layer over the existing responsive React application. It must **not** create a separate mobile frontend or duplicate existing pages.

The feature will also introduce a dedicated mobile-oriented ISBN scanner route and expose high-value mobile destinations as PWA shortcuts:

* **Scan ISBN**
* **Wishlists**
* **Loans**

The PWA may cache application/static assets necessary to load the frontend, but **library/API data must remain network-authoritative in V1**. Offline library operation, background synchronization, push notifications, and native OS widgets are explicitly outside this ticket.

Production PWA functionality depends on the application eventually being served over HTTPS. The feature should nevertheless be implemented and testable locally before production HTTPS is available.

---

## Motivation

Shade Library already contains several workflows that are particularly useful from a phone:

* ISBN scanning using the device camera.
* Adding books to wishlists while away from the physical library.
* Viewing and managing loans.
* Viewing the responsive library application generally.

The existing New Book workflow already provides a reusable camera ISBN scanner and immediately hands a detected ISBN into the application's lookup workflow. The PWA implementation should reuse this capability rather than introducing another scanner implementation. 

Loans also already mounts collection ISBN scanning behavior, making it an intentionally useful mobile destination. 

The objective is therefore not to build a mobile application. It is to make the existing application installable and provide efficient mobile entry points into workflows that already exist.

---

# User Experience

## Installing Shade Library

Once the production application is available over HTTPS, a user should be able to install/add Shade Library to the device Home Screen using the browser/platform's supported PWA installation mechanism.

The installed application should:

* Display as **Shade Library**.
* Use the supplied library icon as the basis for the installed application icon.
* Launch in standalone/app-like display mode where supported.
* Open the normal Shade Library application.
* Continue using the same backend and runtime configuration as the browser version.
* Receive normal frontend deployments rather than becoming a separately maintained application.

The PWA must remain usable as an ordinary website when it has not been installed.

---

# PWA Application Identity

Use the supplied library icon as the source artwork for the PWA icon family.

Generate the necessary PWA icon sizes/variants from that source rather than introducing unrelated branding.

Suggested manifest identity:

```text
name: Shade Library
short_name: Shade Library
start_url: /
display: standalone
```

Theme/background colors should be selected from the existing Shade Library visual system rather than introducing a new PWA-specific palette.

Include the appropriate application/icon metadata for supported mobile browsers.

---

# PWA Shortcuts

Where supported by the installed platform, expose manifest shortcuts for the highest-value mobile destinations.

Initial shortcuts:

```text
Scan ISBN  → /scan
Wishlists  → /wishlists
Loans      → /loans
```

Wishlists and Loans must route to their existing application pages. Do not create PWA-specific versions of either page.

Both are already first-class routes in the centralized application router.  

Shortcut availability is platform-dependent. The application must not depend upon shortcuts being supported.

---

# Dedicated Scanner Route

## Route

Introduce:

```text
/scan
```

The scanner should be registered through the application's existing centralized route architecture.

The application currently defines its route configuration under `AppShell` and derives individual paths/titles from `routeMetadata`; the scanner should follow the same pattern rather than being introduced as an exceptional top-level implementation. 

Expected changes will therefore include the appropriate entries in:

```text
src/routes/routeMetadata.*
src/routes/lazyRoutePages.*
src/routes/routes.tsx
```

Exact filenames should follow the existing project structure.

`routes.tsx` currently imports lazy route pages through `lazyRoutePages` and associates them with metadata-driven paths, so `ScanIsbnPage` should be integrated the same way. 

---

## Scanner UX

`/scan` should be deliberately minimal and optimized for launching from a phone.

Conceptually:

```text
Shade Library

Scan ISBN

[camera scanner]

Cancel
```

Opening `/scan` should make the scanner immediately available without requiring the user to navigate through the full New Book form first.

Reuse the existing:

```text
IsbnCameraScanner
```

Do **not** introduce a second camera/barcode implementation.

After an ISBN is successfully detected, hand the detected ISBN into the application's established ISBN/book workflow.

The scanner route should not independently reimplement metadata lookup rules, ISBN validation, duplicate-book behavior, or other book business logic already owned elsewhere.

---

# Scanner Result Behavior

The dedicated scanner is an **entry point**, not a separate book-management system.

After successful detection, route the user into the appropriate existing application workflow with the scanned ISBN supplied to it.

At minimum, the implementation should support the existing New Book lookup path.

Prefer a flow equivalent to:

```text
/scan
   ↓
camera opens
   ↓
ISBN detected
   ↓
existing ISBN handling/lookup workflow
   ↓
existing application UI
```

If the current routing/query-parameter contract already allows New Book to receive an ISBN, reuse it.

If a small extraction/refactor is necessary to share existing ISBN-handling logic cleanly between `NewBookPage` and `ScanIsbnPage`, perform that extraction rather than duplicating logic.

The New Book route is already registered as a normal application route and should remain the owner of book creation. 

---

# Camera Failure / Permission UX

The scanner route must handle normal camera failure states.

Examples include:

* Camera permission denied.
* No usable camera.
* Browser does not support the required camera APIs.
* Scanner initialization failure.
* User cancels scanning.

The user must never become trapped on `/scan`.

Provide an obvious path back into Shade Library and, where appropriate, allow the user to fall back to the existing manual ISBN/book-entry workflow.

Do not invent PWA-specific camera permissions. Continue using the browser/device permission model already used by `IsbnCameraScanner`.

---

# Manifest

Add and configure a Web App Manifest containing, at minimum:

* Application name.
* Short name.
* Start URL.
* Standalone display mode.
* Theme color.
* Background color.
* Icon definitions.
* Scanner shortcut.
* Wishlists shortcut.
* Loans shortcut.

The manifest should be generated/managed using the project's selected Vite PWA integration where practical rather than maintaining redundant configuration in multiple locations.

---

# Vite / Build Integration

Add PWA support to the existing Vite build.

Prefer an established Vite-compatible PWA integration rather than implementing a custom service-worker build pipeline unless the project architecture gives a concrete reason not to.

Expected implementation areas include:

```text
package.json
vite.config.ts
index.html
public/
src/
```

The resulting production build should contain all manifest, icon, and service-worker artifacts necessary for installation.

PWA support must be reproducible through the normal project build.

There must be **no manual post-build modification of the deployed container**.

---

# Service Worker

## Initial Scope

The first service worker should be deliberately conservative.

Its purpose is primarily to support the PWA application shell/static resources, not to make Shade Library an offline database application.

Static resources suitable for caching may include:

```text
compiled JS/CSS
fonts
PWA icons
static Shade Library artwork
other immutable/versioned frontend assets
```

---

## API Data

Do **not** introduce persistent offline caching of library API responses in this ticket.

In particular, do not create service-worker behavior that causes stale copies of:

```text
/books
/loans
/dashboard
/wishlists
/collections
```

or other application API responses to silently replace network-authoritative data.

The existing TanStack Query/application caching behavior should remain responsible for frontend data state.

The PWA service worker must not become a second competing application-data cache.

---

# Runtime Configuration

Runtime configuration must remain network/current-build authoritative.

Do not allow the service worker to indefinitely cache deployment-generated runtime configuration such as:

```text
/config.js
```

The current deployment architecture intentionally permits runtime configuration to differ between deployments without rebuilding the frontend. PWA caching must preserve that property.

A newly deployed runtime configuration must not remain hidden behind a stale service-worker response.

---

# Update Behavior

Frontend deployments must update installed PWAs predictably.

Avoid a situation where a phone remains indefinitely pinned to an old JS/CSS bundle after a deployment.

Configure the service worker/update strategy so that:

* new builds are detected;
* versioned frontend assets can safely be replaced;
* old caches are cleaned up appropriately;
* application updates do not require uninstalling/reinstalling Shade Library.

Do not introduce a complicated custom update UI unless necessary.

If the selected PWA tooling provides a safe automatic update strategy suitable for this application, prefer it.

---

# HTTPS / Deployment Boundary

Production PWA functionality requires a secure origin.

HTTPS provisioning itself is **not part of this ticket**.

The frontend container should not be modified to terminate public TLS solely for PWA support.

The intended deployment boundary remains:

```text
Internet / Phone
       ↓
HTTPS
       ↓
external proxy/orchestrator
       ↓
Shade frontend container
       ↓
Shade API
```

PWA implementation belongs in the frontend source/build.

The feature should be developed and tested on localhost before public HTTPS is complete. Final physical-device installation and camera verification should occur after the deployed application has a valid secure origin.

---

# Existing Routing Architecture

Do not bypass the application's existing route architecture.

The current router is constructed with `createBrowserRouter(routeConfig)`. 

Existing pages, including Home, Dashboard, Books, Wishlists, Collections, New Book, Loans, and Shelves, are children of the shared `AppShell`.   

`/scan` should follow this same pattern so navigation, accessibility landmarks, visual shell behavior, route titles, and error behavior remain consistent.

---

# Mobile Navigation Principle

Do not create a second navigation system specifically for the PWA.

Installing Shade Library should expose the existing responsive application.

Manifest shortcuts are simply alternate entry points:

```text
Home Screen icon
      ↓
      /

Shortcut: Scan ISBN
      ↓
    /scan

Shortcut: Wishlists
      ↓
 /wishlists

Shortcut: Loans
      ↓
   /loans
```

After entering through any shortcut, normal application navigation should work exactly as it does when the application was opened through the browser.

---

# Icon Assets

Use the supplied library icon as the initial source asset.

Create the required derived icon assets in the appropriate frontend static/public asset location.

Include the sizes required by the selected PWA implementation and supported target browsers.

Where applicable, provide:

* standard PWA icons;
* appropriate high-resolution icon;
* Apple/Home Screen-compatible icon metadata;
* maskable icon support if the supplied artwork can be adapted safely.

Do not stretch or distort the supplied source image.

If padding/background treatment is required for maskable icons, preserve the recognizable library-building artwork and avoid clipping important parts of the design.

---

# Accessibility

The PWA must preserve the frontend's existing accessibility expectations.

The `/scan` route must:

* Have an appropriate page heading.
* Provide accessible scanner controls.
* Provide accessible cancel/fallback navigation.
* Surface scanner/camera errors accessibly.
* Preserve keyboard navigation when accessed on desktop.
* Not interfere with existing application landmarks provided by `AppShell`.

Installation-specific metadata should provide meaningful application/shortcut names rather than icon-only actions.

---

# Testing

## Unit / Component Tests

Add tests covering the dedicated scanner route.

At minimum:

### Scanner rendering

Verify that `/scan` renders the scanner experience.

### Successful detection

Verify that a detected ISBN is passed into the intended existing workflow.

The test should establish that scanner detection results in the expected navigation/state transition without duplicating the internals of ISBN lookup.

### Cancel

Verify that cancelling scanning leaves the user in a valid application location.

### Scanner failure

Verify that a camera/scanner failure produces usable fallback UI rather than a dead-end page.

---

## Routing Tests

Update route tests as appropriate to verify:

```text
/scan
```

is registered and resolves to the scanner page.

Preserve coverage of existing routes.

---

## PWA Build Tests

Add automated verification for the generated production artifacts where practical.

The production build should establish that:

* a valid manifest is emitted;
* required application icons are referenced;
* the service worker is emitted/registered as expected;
* `/scan`, `/wishlists`, and `/loans` shortcuts are represented correctly;
* runtime configuration is not accidentally precached in a way that defeats its deployment semantics.

Avoid tests that depend unnecessarily on generated hashed asset filenames.

---

## Existing Gates

The implementation must pass the project's normal frontend quality gates, including existing:

```text
typecheck
lint/check
unit tests
production build
coverage requirements
Playwright tests
```

Do not reduce coverage thresholds to accommodate the PWA implementation.

---

# Manual Local Verification

Before deployment, verify using the production build locally where possible:

1. Application loads normally as a website.
2. Manifest is detected by browser developer tools.
3. PWA icons resolve successfully.
4. Service worker registers successfully.
5. Application shell survives a normal reload.
6. Existing API calls continue using current network/API behavior.
7. Runtime configuration continues loading correctly.
8. `/scan` can initialize the existing scanner in a supported local secure context.
9. `/wishlists` behaves normally.
10. `/loans` behaves normally.
11. Existing desktop behavior is unchanged.

---

# Post-HTTPS Physical Device Verification

Once the production HTTPS certificate/proxy work is complete, perform a final real-device verification.

This deployment verification is part of accepting the feature even though certificate provisioning itself is not.

Verify on the target phone:

1. Open the deployed Shade Library URL.
2. Add/install Shade Library to the Home Screen.
3. Confirm the supplied library artwork appears as the application icon.
4. Launch from the Home Screen.
5. Confirm the application opens in standalone mode where supported.
6. Confirm authentication/runtime configuration still works.
7. Open `/scan`.
8. Grant camera permission.
9. Scan a real ISBN.
10. Confirm the detected ISBN reaches the established application workflow.
11. Open Wishlists.
12. Confirm normal wishlist interaction works on the installed application.
13. Open Loans.
14. Confirm normal loan interaction works on the installed application.
15. Close and relaunch the PWA.
16. Confirm the application remains usable after a frontend redeployment/update.

Manifest shortcut availability should also be checked on the target platform, but lack of OS support for a standards-compliant shortcut implementation should not constitute an application defect.

---

# Security

PWA installation must not weaken existing authentication or API security.

Specifically:

* Do not place authentication tokens in the manifest.
* Do not encode secrets into PWA shortcuts.
* Do not persist credentials through a new custom PWA storage mechanism.
* Do not expose runtime secrets through cached static resources.
* Continue using the application's existing API/authentication mechanism.
* Camera access must continue to rely on explicit browser/device permission.

The service worker should have the narrowest practical scope necessary for the application.

---

# Performance

PWA support should not substantially increase initial application cost.

In particular:

* Continue lazy-loading expensive scanner dependencies.
* Do not include the camera/barcode scanner implementation in the initial application bundle solely because `/scan` exists.
* Load scanner functionality when the scanner route/experience requires it.
* Avoid unnecessarily precaching large decorative assets.
* Do not precache API datasets.

The dedicated scanner page should favor **fast time-to-camera** on a phone.

---

# Documentation

Update relevant frontend/deployment documentation to record:

* Shade Library is PWA-capable.
* PWA implementation lives in the frontend.
* Production installation requires HTTPS.
* Public TLS remains an external deployment concern.
* `/scan` is the dedicated scanner entry point.
* API data is not intentionally available offline.
* Runtime configuration must remain fresh/network-authoritative.
* How to regenerate/replace PWA icons.
* How to verify manifest/service-worker behavior locally.
* How to perform final installation testing after deployment.

---

# Non-Goals

The following are explicitly **not part of this feature**:

* Native iOS application.
* Native Android application.
* App Store distribution.
* Google Play distribution.
* Native iOS/Android Home Screen data widgets.
* Dashboard OS widget.
* Offline database synchronization.
* Offline book creation.
* Offline wishlist mutation.
* Offline checkout/check-in.
* Background synchronization.
* Push notifications.
* Notification badges.
* Background ISBN scanning.
* Separate mobile frontend.
* PWA-specific Wishlists page.
* PWA-specific Loans page.
* TLS certificate provisioning.
* Reverse-proxy configuration unrelated to serving required PWA assets.

These may be considered separately after the installed PWA has been proven useful.

---

# Acceptance Criteria

The feature is complete when:

* [ ] Shade Library exposes a valid Web App Manifest.
* [ ] The supplied library icon has been converted into the required PWA icon assets.
* [ ] The manifest identifies the application as **Shade Library**.
* [ ] The application requests standalone display behavior.
* [ ] The normal Home Screen launch opens `/`.
* [ ] A `/scan` route exists.
* [ ] `/scan` follows the existing `routeMetadata`/lazy-route/router architecture.
* [ ] `/scan` reuses the existing `IsbnCameraScanner`.
* [ ] Scanner code remains appropriately lazy-loaded.
* [ ] Successful ISBN detection enters the established ISBN/book workflow rather than duplicating it.
* [ ] Scanner cancellation provides a valid escape path.
* [ ] Scanner/camera failure provides a usable fallback.
* [ ] The manifest exposes a **Scan ISBN** shortcut to `/scan` where shortcuts are supported.
* [ ] The manifest exposes a **Wishlists** shortcut to `/wishlists` where shortcuts are supported.
* [ ] The manifest exposes a **Loans** shortcut to `/loans` where shortcuts are supported.
* [ ] Existing Wishlists and Loans pages are reused unchanged as the destinations for those shortcuts.
* [ ] A service worker is generated and registered.
* [ ] Static/application assets use a deliberate caching strategy.
* [ ] Application API data is not persistently precached for offline use.
* [ ] Runtime configuration such as `/config.js` cannot become indefinitely stale because of the service worker.
* [ ] A normal frontend deployment can update an installed PWA without requiring reinstallation.
* [ ] PWA artifacts are generated through the normal frontend build.
* [ ] No manual changes to the running frontend container are required.
* [ ] Existing browser use remains functional without installing the PWA.
* [ ] Existing desktop behavior remains unchanged.
* [ ] Unit/component tests cover the new scanner route behavior.
* [ ] Production-build/PWA artifact tests are added where appropriate.
* [ ] Existing typecheck, lint, coverage, unit, build, and Playwright gates pass.
* [ ] Local production-build PWA verification succeeds.
* [ ] After HTTPS is available, Shade Library can be installed and launched successfully on the target phone.
* [ ] After HTTPS is available, the camera ISBN scanner works from the installed application on the target phone.

---

## Future Follow-Up

Once this feature has been deployed and used on a real phone, evaluate actual mobile usage before expanding the PWA surface.

Likely follow-up candidates include:

```text
PWA
 │
 ├── richer scanner actions
 │    ├── Add to Library
 │    ├── Add to Wishlist
 │    └── Open existing book
 │
 ├── push notifications
 │
 ├── application badge
 │
 └── native companion/widget
      └── dashboard statistics
```

Those should remain separate features. The purpose of this ticket is to establish a **small, reliable, installable Shade Library application using the frontend and API that already exist**, rather than prematurely creating a second mobile platform.

