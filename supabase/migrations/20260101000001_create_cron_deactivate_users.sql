-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to deactivate inactive users daily at 2 AM UTC
-- This will call the edge function automatically
SELECT cron.schedule(
  'deactivate-inactive-users',  -- Job name
  '0 2 * * *',                   -- Schedule: Daily at 2 AM UTC (9 AM WIB)
  $$
  SELECT net.http_post(
    url := 'https://efxyhgmnrplittfahgzu.supabase.co/functions/v1/deactivate-inactive-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeHloZ21ucnBsaXR0ZmFoZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDA1NzIsImV4cCI6MjA4MTUxNjU3Mn0.TOVoKgPj6bnWW2pfx-JexdM8xhUhASOVPIOrTJllzYM'
    )
  );
  $$
);

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- To unschedule this job, run:
-- SELECT cron.unschedule('deactivate-inactive-users');
