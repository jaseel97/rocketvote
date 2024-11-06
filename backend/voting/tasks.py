from celery import shared_task
from .redis_pool import get_redis_connection

@shared_task
def delete_poll(creation_id):
    print("IN DELETE TASK")
    redis_conn = get_redis_connection()
    poll_id = redis_conn.get(f'{creation_id}:poll_id')
    if poll_id is None:
        print("Poll not found for given creation_id.")
        return False

    poll_id = poll_id.decode('utf-8')
    
    keys_to_delete = [
        f'{poll_id}:metadata',
        f'{poll_id}:votes',
        f'{poll_id}:count',
        f'{creation_id}:poll_id'
    ]

    for key in keys_to_delete:
        redis_conn.delete(key)
    
    print(f"All keys related to poll_id {poll_id} have been deleted.")
    return True