<?php
/**
 * Contact form config – copy to contact-form-config.php and set your values.
 * Do not commit contact-form-config.php (it is in .gitignore).
 */
declare(strict_types=1);

// Recipients (comma-separated) and From
// GoDaddy: From must be a valid email on your domain (e.g. noreply@uthini123.com in Workspace Email).
$contact_to           = 'you@example.com';
$contact_from_email   = 'noreply@yourdomain.com';
$contact_from_name    = 'Site Contact';

// MS SQL Server – run contact_log.sql once to create the table
$contact_db_driver = 'sqlsrv';
$contact_db_host = 'P3NWPLSK12SQL-v11.shr.prod.phx3.secureserver.net';
$contact_db_name = 'Drazzing123_';
$contact_db_user = 'uthini';
$contact_db_pass = 'YOUR_PASSWORD'; // set your database password
