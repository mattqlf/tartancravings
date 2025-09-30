-- Enable real-time for the payment_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;

-- Verify it's enabled (optional)
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';