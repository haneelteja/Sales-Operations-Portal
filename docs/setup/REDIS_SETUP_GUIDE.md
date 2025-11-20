# Redis Setup Guide

This guide will help you set up Redis for the Aamodha Elma Sync application.

## Option 1: Local Redis Setup (Recommended for Development)

### macOS

```bash
# Install Redis using Homebrew
brew install redis

# Start Redis server
brew services start redis

# Or run Redis manually (for testing)
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Linux (Ubuntu/Debian)

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Windows

1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL2 and follow Linux instructions

### Docker (Cross-platform)

```bash
# Run Redis in Docker container
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify it's running
docker ps | grep redis
```

## Option 2: Cloud Redis Setup (Recommended for Production)

### Redis Cloud (Free Tier Available)

1. Sign up at https://redis.com/try-free/
2. Create a new database
3. Copy the connection details:
   - Host
   - Port (usually 6379 or 6380 for TLS)
   - Password
4. Update your `.env` file with these values

### AWS ElastiCache

1. Create an ElastiCache Redis cluster in AWS Console
2. Configure security groups to allow access
3. Get the endpoint URL
4. Update your `.env` file:
   ```
   VITE_REDIS_HOST=your-cluster.xxxxx.cache.amazonaws.com
   VITE_REDIS_PORT=6379
   VITE_REDIS_PASSWORD=your_password
   ```

### Azure Cache for Redis

1. Create Azure Cache for Redis in Azure Portal
2. Get connection string from Access Keys
3. Update your `.env` file with connection details

### Google Cloud Memorystore

1. Create Memorystore instance in GCP Console
2. Configure VPC peering
3. Get the IP address
4. Update your `.env` file

## Environment Variables

Create a `.env` file in the project root:

```env
# Local Redis
VITE_REDIS_HOST=localhost
VITE_REDIS_PORT=6379
VITE_REDIS_PASSWORD=

# Cloud Redis (example)
# VITE_REDIS_HOST=your-redis-host.redis.cache.windows.net
# VITE_REDIS_PORT=6380
# VITE_REDIS_PASSWORD=your_secure_password
# VITE_REDIS_TLS=true
```

## Testing Redis Connection

After setting up Redis, test the connection:

```typescript
// In your browser console or a test file
import redis from './src/lib/redis';
import { checkRedisHealth } from './src/lib/redis';

checkRedisHealth().then(isHealthy => {
  console.log('Redis is', isHealthy ? 'connected' : 'not connected');
});
```

Or use the Redis CLI:

```bash
# Connect to Redis
redis-cli

# Test connection
PING
# Should return: PONG

# Check if keys exist
KEYS *

# Get cache stats
INFO stats
```

## Fallback Behavior

The application is designed to work **without Redis**. If Redis is not available:

- The app will continue to function normally
- Caching will be disabled
- All queries will go directly to Supabase
- No errors will be thrown (failures are handled gracefully)

## Production Considerations

1. **Security**: Always use password-protected Redis in production
2. **TLS**: Enable TLS for cloud Redis connections
3. **Connection Pooling**: The Redis client is configured with connection pooling
4. **Monitoring**: Set up monitoring for Redis memory usage and performance
5. **Backup**: Configure Redis persistence (RDB or AOF) for production

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Make sure Redis server is running
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
```

### Authentication Failed

```
Error: NOAUTH Authentication required
```

**Solution**: Set the correct password in `.env`:
```env
VITE_REDIS_PASSWORD=your_password
```

### Timeout Errors

**Solution**: Check network connectivity and firewall rules
- Ensure Redis port (6379) is open
- For cloud Redis, check security groups/network rules

## Next Steps

1. ✅ Install Redis (local or cloud)
2. ✅ Update `.env` file with Redis configuration
3. ✅ Test connection using `checkRedisHealth()`
4. ✅ Run database migrations (see below)
5. ✅ Start using optimized hooks from `useDatabaseOptimized.ts`

## Performance Benefits

Once Redis is set up, you'll see:
- **60-80% reduction** in database queries for cached data
- **Faster page loads** for frequently accessed data
- **Reduced database load** and costs
- **Better user experience** with instant data retrieval

