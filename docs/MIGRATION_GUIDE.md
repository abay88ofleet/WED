# Database Migration Guide

This guide explains how to apply all database migrations to your Supabase instance using terminal commands.

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Environment variables configured**
   - Ensure your `.env` file contains:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Supabase project access token**
   - Get your access token from: https://app.supabase.com/account/tokens
   - Set it as an environment variable:
     ```bash
     export SUPABASE_ACCESS_TOKEN=your-access-token
     ```

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Link Your Project

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref
```

To find your project ref:
- Go to https://app.supabase.com
- Select your project
- The ref is in the URL: `https://app.supabase.com/project/[YOUR-PROJECT-REF]`
- Or extract it from your `VITE_SUPABASE_URL`: `https://[YOUR-PROJECT-REF].supabase.co`

### Step 2: Apply All Migrations

```bash
# Push all migrations from the supabase/migrations folder
supabase db push
```

This command will:
- Read all `.sql` files from `supabase/migrations/`
- Apply them in chronological order
- Skip already applied migrations

### Step 3: Verify Migrations

```bash
# Check migration status
supabase migration list

# Or check the database directly
supabase db remote --help
```

## Method 2: Using Supabase SQL Editor (Web UI)

### Step 1: Access SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply Migrations Manually

Apply each migration file in order:

#### 1. Initialize Document Library
```sql
-- Copy and paste content from:
-- supabase/migrations/20251005093047_initialize_document_library.sql
```

#### 2. Create Storage Bucket
```sql
-- Copy and paste content from:
-- supabase/migrations/20251005093109_create_storage_bucket.sql
```

#### 3. Add Soft Copy Columns
```sql
-- Copy and paste content from:
-- supabase/migrations/add_soft_copy_columns.sql
```

### Step 3: Verify Tables Created

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check categories
SELECT * FROM categories;
```

## Method 3: Using a Custom Migration Script

Create a migration script to automate the process:

### Step 1: Create the Script

```bash
# Create a new file
nano apply-migrations.sh
```

```bash
#!/bin/bash

# Configuration
PROJECT_REF="your-project-ref"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key"  # Get from Supabase Dashboard > Settings > API

# Migration files in order
MIGRATIONS=(
  "supabase/migrations/20251005093047_initialize_document_library.sql"
  "supabase/migrations/20251005093109_create_storage_bucket.sql"
  "supabase/migrations/add_soft_copy_columns.sql"
)

echo "Starting database migration..."

for MIGRATION_FILE in "${MIGRATIONS[@]}"; do
  if [ -f "$MIGRATION_FILE" ]; then
    echo "Applying: $MIGRATION_FILE"

    # Read SQL file and execute
    MIGRATION_SQL=$(cat "$MIGRATION_FILE")

    # Execute using Supabase REST API
    curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}"

    echo "✓ Applied: $MIGRATION_FILE"
  else
    echo "✗ File not found: $MIGRATION_FILE"
  fi
done

echo "Migration complete!"
```

### Step 2: Make Script Executable

```bash
chmod +x apply-migrations.sh
```

### Step 3: Run the Script

```bash
./apply-migrations.sh
```

## Method 4: Using Node.js Script

Create a Node.js script for more control:

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js fs path
```

### Step 2: Create Migration Script

Create `scripts/migrate.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Migration files in order
const migrations = [
  '20251005093047_initialize_document_library.sql',
  '20251005093109_create_storage_bucket.sql',
  'add_soft_copy_columns.sql',
];

async function executeMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    console.log(`Applying: ${filename}`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`✗ Error in ${filename}:`, error.message);
      return false;
    }

    console.log(`✓ Applied: ${filename}`);
    return true;
  } catch (err) {
    console.error(`✗ Exception in ${filename}:`, err.message);
    return false;
  }
}

async function runMigrations() {
  console.log('Starting database migration...\n');

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await executeMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('Migration Summary:');
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log('\nMigration complete!');
}

runMigrations();
```

### Step 3: Run the Migration

```bash
node scripts/migrate.js
```

## Method 5: Direct SQL Execution via psql

If you have direct PostgreSQL access:

### Step 1: Get Connection String

1. Go to Supabase Dashboard
2. Navigate to **Settings** > **Database**
3. Copy the **Connection String** (Direct connection)

### Step 2: Apply Migrations

```bash
# Set the connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Apply each migration
psql $DATABASE_URL -f supabase/migrations/20251005093047_initialize_document_library.sql
psql $DATABASE_URL -f supabase/migrations/20251005093109_create_storage_bucket.sql
psql $DATABASE_URL -f supabase/migrations/add_soft_copy_columns.sql
```

## Verification Commands

After applying migrations, verify the setup:

### Check Tables

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Categories

```sql
-- View categories
SELECT id, name, icon, color FROM categories;
```

### Check Documents Table Structure

```sql
-- View documents table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

### Check RLS Policies

```sql
-- View Row Level Security policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Check Storage Bucket

```sql
-- View storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'documents';
```

## Troubleshooting

### Issue: "relation already exists"

**Solution:** The migration has already been applied. This is safe to ignore.

### Issue: "permission denied"

**Solution:** Make sure you're using the `SERVICE_ROLE_KEY`, not the `ANON_KEY`.

### Issue: "could not connect to server"

**Solution:** Check your:
1. Internet connection
2. Supabase URL is correct
3. Project is not paused (free tier projects pause after inactivity)

### Issue: "syntax error in SQL"

**Solution:**
1. Check if the SQL file is properly formatted
2. Ensure there are no special characters or encoding issues
3. Try applying the migration via Supabase SQL Editor first

## Best Practices

1. **Always backup before migrations** (for production)
   ```bash
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

2. **Test migrations in development first**
   - Use a separate Supabase project for testing
   - Verify all migrations work before applying to production

3. **Use version control**
   - Keep all migration files in git
   - Use timestamped filenames for ordering

4. **Document your migrations**
   - Add comments explaining what each migration does
   - Keep a changelog of schema changes

5. **Monitor after deployment**
   - Check application logs
   - Verify RLS policies work as expected
   - Test user permissions

## Quick Reference

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref your-ref

# Apply all migrations
supabase db push

# Check migration status
supabase migration list

# Create a new migration
supabase migration new migration_name

# Reset local database (WARNING: Destroys data)
supabase db reset
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Note:** The migrations in this project have already been applied via the Supabase MCP tools during development. This guide is for reference if you need to apply them to a different Supabase instance or redeploy the database.
