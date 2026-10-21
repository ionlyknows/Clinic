# Clinic Booking

Single-clinic appointment booking and staff management built with the existing Laravel 13 React/Inertia starter kit. The clinic operates in `Asia/Manila`; appointment `DATETIME` values are interpreted as local clinic wall time.

## Requirements

- PHP 8.3 or newer and Composer
- Node.js and npm
- MySQL 8.0.16+ or a MariaDB version that enforces `CHECK` constraints for production use

On Windows, the Vite build looks for PHP on `PATH`, in `.tools/php83/php.exe`, or in the standard XAMPP location. Set `CLINIC_PHP_BINARY` if PHP 8.3 is installed elsewhere. The Composer `dev` command also adds its active PHP executable to the child-process path, so Wayfinder can run while Vite is serving.

SQLite is configured for automated tests. This does not verify MySQL/MariaDB transaction locking or constraint behavior.

## Local setup

1. Install dependencies and create the local environment file:

   ```sh
   composer install
   cp .env.example .env
   php artisan key:generate
   npm install
   ```

2. Configure `.env` with a dedicated MySQL database and account. Set `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`. Set `CLINIC_NAME` and `CLINIC_CONTACT` to the clinic's approved public details. Never commit `.env` or real patient data.

3. Create the schema and the seven initially closed weekdays, then create the first admin through the secure console prompt:

   ```sh
   php artisan migrate --seed
   php artisan clinic:make-admin
   ```

   No staff account or real clinic hours/services are seeded. Configure at least one service and opening day after logging in.

4. Start the Laravel and Vite development servers:

   ```sh
   composer dev
   ```

## Tests

```sh
php artisan test
```

The test suite uses an isolated in-memory SQLite database from `phpunit.xml`; it never connects to the configured shared MySQL database. Run migrations against a disposable MySQL/MariaDB database separately before deployment and verify its actual engine/version and check-constraint enforcement.

## Access and operating notes

- Public registration is disabled. Create the first admin with `php artisan clinic:make-admin`; create staff accounts only through trusted administrative tooling.
- Staff can manage appointments; only admins can change services, clinic hours, and closure dates.
- Run `composer run seed` to seed the clinic hours and local demo dashboard accounts. The accounts are created only in local/testing: `admin@example.test` and `staff@example.test`, both with password `ClinicDemo!2026`. The admin can manage clinic configuration; staff can use the appointment dashboard. These accounts are not seeded in production.
- New requests are pending until staff confirms them. Patients receive a one-time reference on the immediate success page; there is no public lookup endpoint.
- Service and appointment records retain snapshots. Deactivate services rather than deleting them.
- Before deploying, configure HTTPS, a production session/cache setup, backups, logging and retention practices, and the clinic's reviewed privacy notice. This application does not claim legal compliance or deliver SMS/email notifications.
