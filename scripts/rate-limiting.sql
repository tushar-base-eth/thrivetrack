-- Create rate limiting tables
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ip_address, endpoint)
);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_requests INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old records
  DELETE FROM public.rate_limits 
  WHERE window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL;

  -- Get or create rate limit record
  INSERT INTO public.rate_limits (ip_address, endpoint)
  VALUES (p_ip_address, p_endpoint)
  ON CONFLICT (ip_address, endpoint) DO UPDATE
  SET requests = CASE
    WHEN rate_limits.window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL
    THEN 1
    ELSE rate_limits.requests + 1
    END,
    window_start = CASE
    WHEN rate_limits.window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL
    THEN CURRENT_TIMESTAMP
    ELSE rate_limits.window_start
    END
  RETURNING requests INTO v_current_requests;

  -- Check if limit exceeded
  RETURN v_current_requests <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for rate limiting
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of own rate limits"
ON public.rate_limits FOR SELECT
USING (ip_address = current_setting('request.headers')::json->>'x-real-ip');

CREATE POLICY "Allow public insert/update of own rate limits"
ON public.rate_limits FOR ALL
USING (ip_address = current_setting('request.headers')::json->>'x-real-ip');
