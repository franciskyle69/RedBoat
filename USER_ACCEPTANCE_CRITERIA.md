## User

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Role-Based Access | As a user, I want to log in so that I can access my account securely. | - Open system website<br>- Click Login<br>- Enter email and password OR use Google sign-in<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies user role and grants user access |
| Account Registration | As a user, I want to sign up so that I can create an account. | - Open system website<br>- Click Sign Up<br>- Provide required details<br>- Complete reCAPTCHA (if shown)<br>- Submit registration<br>- System sends verification code to email |
| Email Verification | As a user, I want to verify my email so that my account becomes active. | - Open verification screen<br>- Enter the code sent to email<br>- Click Verify<br>- System confirms account creation and allows login |
| Create Booking | As a user, I want to request a booking so that I can reserve a room. | - Navigate to room booking page<br>- Choose dates, guests, and room<br>- Provide guest and contact details<br>- Submit booking request<br>- System creates booking with pending status |
| Manage My Bookings | As a user, I want to view my bookings so that I can track status and details. | - Open My Bookings page<br>- System lists bookings with status, dates, and total amount<br>- Selecting a booking shows full details |
| Request Cancellation | As a user, I want to request cancellation so that admins can review it. | - Open booking details<br>- Click Request Cancel<br>- Provide optional reason<br>- System records request and marks as cancellation requested |
| Pay for Booking | As a user, I want to pay for confirmed bookings so that my reservation is secured. | - Open confirmed booking<br>- Initiate payment<br>- Complete payment flow<br>- System marks booking as paid and records payment method/date |
| Reset Password | As a user, I want to reset my password so that I can regain access. | - Open Forgot Password page<br>- Enter email and submit<br>- System sends reset code<br>- Verify code and set new password |

## Admin

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Role-Based Access | As an admin, I want to log in so that I can manage the system securely. | - Open system website<br>- Click Login<br>- Enter email and password OR use Google sign-in<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies admin role and grants admin access |
| Manage Bookings | As an admin, I want to review bookings so that I can approve or decline them. | - Open Admin Bookings page<br>- View pending bookings list<br>- Accept or decline a booking<br>- System updates booking status and notifies user |
| Check-in/Check-out | As an admin, I want to check in and check out guests so that stays are tracked. | - Open confirmed booking<br>- Click Check-in and confirm details<br>- System records check-in time<br>- Click Check-out and confirm details<br>- System records check-out time and status |
| Record Payments | As an admin, I want to record payments so that booking status is accurate. | - Open booking details<br>- Click Mark as Paid<br>- Select payment method and optional reference<br>- System records payment status, method, and date |
| Manage Rooms | As an admin, I want to manage rooms so that inventory stays current. | - Open Rooms module<br>- Create, edit, or delete a room<br>- Update availability or housekeeping status<br>- System saves changes and refreshes listings |
| Manage Users | As an admin, I want to manage user accounts so that access is controlled. | - Open Users module<br>- View user list and details<br>- Update user status/role where allowed<br>- System applies changes and logs activity |
| View Reports | As an admin, I want to view reports so that I can track performance. | - Open Reports module<br>- Select report type/date range<br>- System displays report data |
| View Activity Logs | As an admin, I want to view activity logs so that I can audit system actions. | - Open Activity Logs module<br>- System lists recent actions with timestamps and actors |

## Superadmin

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Role-Based Access | As a superadmin, I want to log in so that I can manage the full system. | - Open system website<br>- Click Login<br>- Enter email and password OR use Google sign-in<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies superadmin role and grants full access |
| Full Admin Capabilities | As a superadmin, I want all admin tools so that I can oversee the platform. | - Access all admin modules (bookings, rooms, users, reports, activity logs)<br>- System allows create, update, and delete actions per module |
| Permanent User Deletion | As a superadmin, I want to delete user backups so that compliance requirements are met. | - Open user management or backup tools<br>- Select user backup record<br>- Confirm deletion<br>- System permanently removes the backup and logs the action |
