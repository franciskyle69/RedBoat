## Admin

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Role-Based Access | As an admin, I want to log in so that I can manage the system securely. | - Open system website<br>- Click Login<br>- Enter email and password OR use Google sign-in<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies admin role and grants admin access |
| Forgot Password (Code-Based) | As an admin, I want to reset my password using a code so that I can regain access. | - Click Forgot Password<br>- Enter registered email<br>- Click Send Code<br>- Enter verification code<br>- Set new password<br>- Click Update Password |
| User Role Management | As an admin, I want to manage user roles so that access is controlled. | - Click Users<br>- Select user<br>- Assign role<br>- Changes save successfully |
| Room Booking & Reservation Management | As an admin, I want to approve, update, or cancel reservations so that bookings are controlled. | - Click Reservations/Bookings<br>- Select reservation<br>- Click Approve / Edit / Cancel<br>- System updates booking status |
| Room Availability Calendar | As an admin, I want to view the room calendar so that I can track occupancy. | - Click Room Calendar<br>- View available and occupied rooms |
| Automated Billing & Payment Monitoring | As an admin, I want to monitor payments so that revenue tracking is accurate. | - Click Billing/Payments<br>- View payment records and statuses |
| Check-in / Check-out Tracking | As an admin, I want to track guest check-ins and check-outs so that records are accurate. | - Click Guest Records/Bookings<br>- View status and timestamps |
| Housekeeping Management | As an admin, I want to assign housekeeping tasks so that rooms are ready. | - Click Housekeeping<br>- Assign staff and update room status |
| Report Generation | As an admin, I want to generate reports so that I can analyze performance. | - Click Reports<br>- Select report type/date range<br>- Click Generate |
| Feedback & Review Management | As an admin, I want to review and respond to feedback so that services improve. | - Click Feedback<br>- View and respond to reviews |
| Notification System | As an admin, I want to send notifications so that guests and staff stay informed. | - Click Notifications<br>- Select recipient(s)<br>- Click Send |
| Logout | As an admin, I want to log out so that my account remains secure. | - Click Profile<br>- Click Logout |

## Staff / Management

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Limited Access | As a staff member, I want to log in so that I can perform assigned tasks only. | - Click Login<br>- Enter credentials or use Google Sign-In<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies staff role |
| Forgot Password (Code-Based) | As a staff member, I want to reset my password using a code so that I can regain access. | - Click Forgot Password<br>- Enter email<br>- Enter verification code |
| Room Booking Assistance | As a staff member, I want to assist guests with bookings so that reservations are handled properly. | - Create or update booking<br>- System saves booking changes |
| Room Availability Viewing | As a staff member, I want to view available rooms so that I can assist guests. | - View room availability calendar |
| Billing & Payment Processing | As a staff member, I want to process payments so that reservations are confirmed. | - Select payment method<br>- Update payment status |
| Check-in / Check-out Tracking | As a staff member, I want to record guest arrivals and departures so that records are accurate. | - Mark check-in/check-out |
| Housekeeping Task Updates | As a staff member, I want to update housekeeping status so that room readiness is tracked. | - Update task/status |
| Notifications | As a staff member, I want to receive notifications so that tasks are completed on time. | - Receive reminders/alerts |
| Logout | As a staff member, I want to log out so that my account remains secure. | - Click Logout |

## Client / User

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| User Sign-Up / Registration | As a user, I want to create an account so that I can book rooms online. | - Click Sign Up<br>- Enter required details<br>- Click Create Account |
| Login | As a user, I want to log in so that I can manage my bookings. | - Click Login<br>- Enter credentials or use Google Sign-In<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In |
| Forgot Password (Code-Based) | As a user, I want to reset my password using a code so that I can access my account again. | - Click Forgot Password<br>- Enter email<br>- Complete reCAPTCHA (if shown)<br>- Enter verification code |
| Online Room Booking & Reservation | As a user, I want to book rooms online so that I can secure my stay. | - Select room and dates<br>- Confirm booking |
| Room Availability Calendar | As a user, I want to view available rooms so that I can choose the best option. | - View room availability |
| Billing & Payment | As a user, I want to make payments so that my booking is confirmed. | - Select payment method<br>- Payment confirmed |
| Check-in / Check-out Details | As a user, I want to view my stay schedule so that I know my booking duration. | - View booking details |
| Feedback & Reviews | As a user, I want to submit feedback so that I can share my experience. | - Submit feedback |
| Notifications | As a user, I want to receive notifications so that I don’t miss my booking. | - Receive confirmations/updates |
| Logout | As a user, I want to log out so that my account remains secure. | - Click Logout |

## Superadmin

| Functional Requirement | User Story | Acceptance Criteria |
| --- | --- | --- |
| Login & Role-Based Access | As a superadmin, I want to log in so that I can manage the full system. | - Open system website<br>- Click Login<br>- Enter email and password OR use Google sign-in<br>- Complete reCAPTCHA (if shown)<br>- Click Sign In<br>- System verifies superadmin role and grants full access |
| Full Admin Capabilities | As a superadmin, I want all admin tools so that I can oversee the platform. | - Access all admin modules (bookings, rooms, users, reports, activity logs)<br>- System allows create, update, and delete actions per module |
| Permanent User Deletion | As a superadmin, I want to delete user backups so that compliance requirements are met. | - Open user management or backup tools<br>- Select user backup record<br>- Confirm deletion<br>- System permanently removes the backup and logs the action |
