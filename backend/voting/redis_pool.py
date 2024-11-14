import redis

pool = redis.ConnectionPool(host='127.0.0.1', port=6379, db=0)

def get_redis_connection():
    return redis.Redis(connection_pool=pool)
