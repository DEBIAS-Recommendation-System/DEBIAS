# TODO: Forgot Password Feature
#
# This feature requires email service configuration to send password reset emails.
# Once an SMTP service is configured (e.g., SendGrid, AWS SES, or Gmail SMTP),
# implement the following endpoints in auth.py:
#
# 1. POST /auth/forgot-password
#    - Accept email address
#    - Generate secure reset token (JWT with 15-minute expiration)
#    - Store token in database with user_id and expiration
#    - Send email with reset link containing token
#
# 2. POST /auth/reset-password
#    - Accept reset token and new password
#    - Validate token hasn't expired
#    - Hash new password and update user record
#    - Invalidate the reset token
#
# Frontend components to create:
# - ForgotPasswordForm.tsx (email input)
# - ResetPasswordForm.tsx (new password + confirm)
# - Add "Forgot password?" link in LoginWithPassword.tsx
#
# Database migration needed:
# - Create password_reset_tokens table with:
#   - id (primary key)
#   - user_id (foreign key to users)
#   - token (hashed)
#   - expires_at (timestamp)
#   - used (boolean)
