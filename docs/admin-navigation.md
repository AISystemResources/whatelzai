# Shared Admin navigation

Every protected admin page uses the same `AdminNavigation` from the owner-guarded admin layout. The former left sidebar/mobile hamburger is removed on phone and desktop.

The sticky header presents Overview, AI Business, Network Marketing and Day Job as normal navigation links in a horizontally scrollable strip. On a phone, swipe the strip to reveal more choices and tap a section to open it. The active workstream scrolls into view when it changes; scrolling the strip does not navigate or interfere with page-body reading. Today remains a direct header shortcut to briefs, routines and weekly reflections.

The bottom bar is **Users | Home | Settings**. Home always opens the main Overview. Workstream pages and Today belong to Home; Users and Settings have their own active states without falsely selecting a workstream. Deep links use their owning section, including team/calendar access under Network Marketing, and profile/tokens/developer under Settings. Production clean-host paths and local/preview `/admin` paths resolve consistently. Existing tool URLs and page actions are preserved.

The header and bottom bar accommodate phone safe areas; body padding keeps final controls clear of the fixed bottom bar. Desktop uses the same navigation with wider content. The install control and sign-out remain in Settings; PWA identity, Today launch destination, owner access and member fcOS navigation are unchanged.

Verify all four workstream links, bottom tabs, Today/skill deep links, browser back/forward, narrow horizontal overflow and the Settings install/sign-out controls. Do not submit forms, reset credits or sign out as a navigation test.
