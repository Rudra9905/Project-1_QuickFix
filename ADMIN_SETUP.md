# Admin Setup Guide

## How to Create Your Admin User

Since you are the only admin for this application, the first user to register will automatically become the admin. Here's how to set it up:

1. Make sure the backend server is running
2. Go to the registration page at http://localhost:3000/register
3. Fill in your details with the following:
   - Name: Your name
   - Email: Your admin email
   - Password: Your secure password
   - Role: Select "ADMIN" from the dropdown
4. Click "Register"

**Important:** The system is designed so that only the first user can register as an admin. Any subsequent registrations will automatically be assigned the USER role, even if ADMIN is selected.

## Accessing the Admin Dashboard

Once you've registered as the admin:

1. Log in with your admin credentials
2. Navigate to http://localhost:3000/admin
3. You should see the Admin Dashboard where you can review and manage provider applications

## Troubleshooting

### Data Truncation Error

If you encounter a "Data truncated for column 'role'" error when registering as admin, this is due to a database schema issue. Please refer to the [DB_FIX.md](./DB_FIX.md) file for solutions.

### Resetting Admin User

If you accidentally create a regular user first and want to reset to create the admin:

1. Stop the backend server
2. Delete the database (or truncate all tables)
3. Restart the backend server
4. Register again as the first user with ADMIN role

This restriction ensures that only the very first user can become the admin, preventing unauthorized admin accounts from being created.