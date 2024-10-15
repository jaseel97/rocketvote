import redis

pool = redis.ConnectionPool(host='redis', port=6379, db=0)

def get_redis_connection():
    return redis.Redis(connection_pool=pool)
