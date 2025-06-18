/**
 * Enhanced token verification function that provides better error logging
 */
export function validateToken(token: string): any {
  if (!token) {
    console.error('[Auth] No token provided');
    return null;
  }
  
  try {
    console.log(`[Auth] Verifying token: ${token.substring(0, 10)}...`);
    
    // Parse the token - you can use jwt-decode or simple base64 parsing to check structure
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('[Auth] Invalid token format');
      return null;
    }
    
    try {
      // Try to parse the payload (middle part)
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('[Auth] Token payload:', payload);
      
      // Check if the token has the necessary fields
      if (!payload.id) {
        console.error('[Auth] Token missing user ID');
      }
      if (!payload.role) {
        console.error('[Auth] Token missing role');
      }
      
      // Check if the token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.error('[Auth] Token expired');
        return null;
      }
      
      return payload;
    } catch (e) {
      console.error('[Auth] Error parsing token payload:', e);
      return null;
    }
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return null;
  }
}
