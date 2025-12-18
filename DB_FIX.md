# Database Schema Fix for ADMIN Role Issue

## Problem Description

When trying to register as an admin user, you might encounter this error:
```
could not execute statement [Data truncated for column 'role' at row 1] [insert into users (city,created_at,email,name,password,phone,role,updated_at) values (?,?,?,?,?,?,?,?)]
```

This happens because the database column for the 'role' field was created before the ADMIN role was added to the UserRole enum, and the column might not have enough space to accommodate the 'ADMIN' string value.

## Solutions

### Solution 1: Using Flyway Migration (Recommended)

The project now includes Flyway migration support. When you restart the application, Flyway will automatically apply the migration script to fix the role column.

### Solution 2: Manual Database Fix

If you prefer to fix this manually, you can run the following SQL command directly on your database:

```sql
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;
```

### Solution 3: Reset Database (Nuclear Option)

If you don't have important data in your database yet, you can:

1. Stop the application
2. Delete the database:
   ```sql
   DROP DATABASE quick_helper;
   CREATE DATABASE quick_helper;
   ```
3. Restart the application - Hibernate will recreate the schema with the correct column sizes

## Prevention

The issue has been fixed in the code by:
1. Adding explicit length specification to the role column in the User entity
2. Adding Flyway migration support to handle schema changes properly
3. Changing from `ddl-auto=update` to `ddl-auto=validate` for better control over schema changes

## Verification

After applying the fix, you should be able to register as an admin user without any issues.