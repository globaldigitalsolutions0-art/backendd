/**
 * Authentication middleware for securing console routes
 */

export const consoleAuth = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }
  
  // Check if it's Basic auth
  if (!authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Basic authentication is required' });
  }
  
  try {
    // Decode the base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    // Check against environment variables or use defaults for development
    const validUsername = process.env.CONSOLE_USERNAME || 'admin';
    const validPassword = process.env.CONSOLE_PASSWORD || 'admin123';
    
    if (username === validUsername && password === validPassword) {
      // Authentication successful
      next();
    } else {
      // Authentication failed
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};