LEXDATA LOGIN AND ROLE TESTING

The V8 patch adds this development-only page:

http://localhost:3000/dev/role-test

HOW TO USE IT

1. Start the site:
   npm.cmd run dev

2. Open:
   http://localhost:3000/login

3. Login with a TEST account.

4. Open:
   http://localhost:3000/dev/role-test

5. Switch the current test account between:
   user
   speaker
   manager
   admin

6. Test these routes:

   Member:
   /dashboard
   /dashboard/messages
   /my/workshops

   Speaker:
   /speaker

   Manager:
   /manager
   /manager/registrations
   /manager/payments
   /manager/notices
   /manager/workshops
   /manager/monitor

   Admin:
   /admin
   /admin/registrations
   /admin/users
   /admin/workshops
   /admin/team

IMPORTANT

- The role test page is blocked in production.
- Use a test account, not your real production admin account.
- Role switching updates the logged-in test user's profiles.role value.
- After switching a role, refresh/open the target dashboard.
- For a full login test, logout and login again after setting the desired role.

EXPECTED ROLE VALUES

user
speaker
manager
admin