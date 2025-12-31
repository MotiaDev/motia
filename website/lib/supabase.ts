// Supabase client configuration for iii-website
// Load from environment variables (Vite uses import.meta.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Simple fetch-based Supabase client for insert operations
export async function insertAccessRequest(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/access_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.text();
      // Handle unique constraint violation (duplicate email)
      if (response.status === 409) {
        return { success: true }; // Treat duplicate as success
      }
      return { success: false, error: error || 'Failed to submit email' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Check if an email exists in Supabase
export async function checkAccessRequest(email: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !email) {
    return false;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/access_requests?email=eq.${encodeURIComponent(email)}&select=email`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('Error checking access request:', error);
    return false;
  }
}

