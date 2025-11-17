// Bypass authentication fix
// This will modify the AuthContext to work without proper authentication

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying authentication bypass fix...\n');

// Read the AuthContext file
const authContextPath = path.join(__dirname, 'src', 'contexts', 'AuthContext.tsx');
let authContext = fs.readFileSync(authContextPath, 'utf8');

// Create a backup
fs.writeFileSync(authContextPath + '.backup', authContext);

// Modify the AuthContext to bypass authentication
const modifiedAuthContext = authContext.replace(
  /const signIn = async \(email: string, password: string\) => \{[\s\S]*?\};/,
  `const signIn = async (email: string, password: string) => {
    console.log('🔐 Bypassing authentication for development...');
    
    // Create a mock user
    const mockUser = {
      id: '6e2e740b-57c6-4468-b073-b379aed3c6a6',
      email: 'nalluruhaneel@gmail.com',
      user_metadata: {
        full_name: 'Haneel Nalluru'
      }
    };
    
    // Create a mock session
    const mockSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token'
    };
    
    // Set the user and session
    setUser(mockUser);
    setSession(mockSession);
    
    // Create a mock profile
    const mockProfile = {
      id: mockUser.id,
      username: mockUser.email,
      full_name: mockUser.user_metadata.full_name,
      role: 'admin',
      status: 'active',
      associated_clients: [],
      associated_branches: []
    };
    
    setProfile(mockProfile);
    
    console.log('✅ Mock authentication successful!');
    return { data: { user: mockUser, session: mockSession }, error: null };
  };`
);

// Write the modified file
fs.writeFileSync(authContextPath, modifiedAuthContext);

console.log('✅ Authentication bypass applied successfully!');
console.log('🎉 You can now use the application without authentication issues!');
console.log('📝 The original file has been backed up as AuthContext.tsx.backup');
console.log('🚀 Start the application with: npm run dev');
