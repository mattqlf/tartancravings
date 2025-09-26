-- Migration: Set up broadcast authorization and trigger for delivery_requests
-- This migration should be run on your Supabase database to enable broadcast functionality

-- 1. Create policy for broadcast authorization
CREATE POLICY "Authenticated users can receive broadcasts"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (true);

-- 2. Create trigger function for delivery_requests
CREATE OR REPLACE FUNCTION public.delivery_requests_changes()
RETURNS trigger
SECURITY definer
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Use the delivery request ID as the topic for targeted updates
  PERFORM realtime.broadcast_changes(
    'delivery_request:' || COALESCE(NEW.id::text, OLD.id::text), -- topic
    TG_OP,                                                        -- event
    TG_OP,                                                        -- operation
    TG_TABLE_NAME,                                                -- table
    TG_TABLE_SCHEMA,                                              -- schema
    NEW,                                                          -- new record
    OLD                                                           -- old record
  );

  -- Also broadcast to a general topic for dashboard updates
  PERFORM realtime.broadcast_changes(
    'delivery_requests_all',                                      -- topic
    TG_OP,                                                        -- event
    TG_OP,                                                        -- operation
    TG_TABLE_NAME,                                                -- table
    TG_TABLE_SCHEMA,                                              -- schema
    NEW,                                                          -- new record
    OLD                                                           -- old record
  );

  RETURN NULL;
END;
$function$;

-- 3. Create trigger that calls the function
DROP TRIGGER IF EXISTS handle_delivery_requests_changes ON public.delivery_requests;

CREATE TRIGGER handle_delivery_requests_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.delivery_requests_changes();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA realtime TO authenticated;