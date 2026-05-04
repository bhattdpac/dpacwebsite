# Unit 02: Authentication & Role-Based Access Control (RBAC)

## Goal
Implement a secure authentication system using JWT (JSON Web Tokens) in the Django backend and a corresponding login/signup flow in the React frontend. Define two primary roles: **Lawyer** (can manage documents and deploy contracts) and **Client** (can review and approve contracts).

## Design
- **Auth Strategy:** JWT (SimpleJWT).
- **User Roles:** Distinguished via a `role` field in the User model or a linked Profile.
- **Frontend Flow:** Login page -> Redirect to Role-specific Dashboard.
- **Security:** API routes protected by JWT; Frontend routes protected by Auth Guards.

## Implementation

### 1. Backend: JWT & RBAC
- Install `djangorestframework-simplejwt`.
- Update `core/settings.py` to include `rest_framework_simplejwt`.
- Define a custom User model in `api/models.py` with a `role` field (Choices: `LAWYER`, `CLIENT`).
- Create a serializer for User registration and details.
- Create views for Login (JWT Token obtain) and Registration.
- Implement a `CurrentUserView` to fetch the authenticated user's role.

### 2. Frontend: Auth Flow
- Install `axios` and `react-router-dom`.
- Create an `AuthContext` to manage user state and tokens.
- Implement `api.ts` (Axios instance with interceptors for JWT).
- Create `LoginPage.tsx` and `SignupPage.tsx`.
- Create a `ProtectedRoute` component to handle role-based access.
- Build a basic `Dashboard.tsx` shell that displays the user's role.

## Dependencies
- Backend: `djangorestframework-simplejwt`.
- Frontend: `axios`, `react-router-dom`, `jwt-decode`.

## Verify when done
- [ ] User can register as a Lawyer or Client.
- [ ] User can login and receive a JWT token.
- [ ] Frontend stores token securely and attaches it to API requests.
- [ ] Unauthorized users are redirected from the Dashboard to the Login page.
- [ ] `Lawyer` users can see lawyer-specific UI elements (placeholder).
- [ ] `Client` users can see client-specific UI elements (placeholder).
- [ ] All tests pass.
