# Database Migration Guide: MySQL to PostgreSQL

This guide documents the steps taken to migrate the Quick Helper application from MySQL to PostgreSQL.

## Changes Made

### 1. Schema Conversion
Created a new PostgreSQL-compatible schema file:
- `src/main/resources/db/migration/V1_0__initial_schema_postgresql.sql`

Key conversions made:
- `AUTO_INCREMENT` → `SERIAL`
- `DATETIME` → `TIMESTAMP`
- `INT` → `INTEGER`
- `DOUBLE` → `DOUBLE PRECISION`
- `TINYINT(1)` → `BOOLEAN`
- ENUM types converted to CHECK constraints

### 2. Application Configuration
Updated `application.properties`:
- Changed JDBC URL from MySQL to PostgreSQL
- Updated username/password for PostgreSQL
- Added `spring.flyway.baseline-on-migrate=true` for initial migration

### 3. Dependencies
Updated `pom.xml`:
- Replaced MySQL connector with PostgreSQL driver
- Replaced Flyway MySQL dependency with PostgreSQL dependency

## Migration Steps

1. **Database Setup**:
   - Install PostgreSQL server
   - Create database `quick_helper`
   - Create user with appropriate permissions

2. **Configuration Updates**:
   - Update `application.properties` with PostgreSQL connection details
   - Ensure Flyway is configured for baseline migration

3. **Dependency Updates**:
   - Replace MySQL connector with PostgreSQL driver in `pom.xml`
   - Update Flyway dependencies

4. **Schema Migration**:
   - Run the application to execute Flyway migrations
   - The new PostgreSQL schema will be created automatically

## PostgreSQL Specific Features Used

- **SERIAL**: Auto-incrementing integer columns
- **CHECK Constraints**: Enforce ENUM-like values
- **Proper Data Types**: Native BOOLEAN, DOUBLE PRECISION
- **Indexes**: Added for performance optimization

## Testing

After migration, thoroughly test:
- User registration and authentication
- Provider profile creation
- Booking workflows
- Review system
- Notification system

## Notes

- The migration preserves all existing functionality
- PostgreSQL offers better data type safety and advanced features
- The schema is now more portable across different environments