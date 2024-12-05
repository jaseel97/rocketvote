from celery import shared_task
from .redis_pool import get_redis_connection

@shared_task
def delete_poll(creation_id):
    redis_conn = get_redis_connection()
    poll_id = redis_conn.get(f'{creation_id}:poll_id')
    if poll_id is None:
        return False

    poll_id = poll_id.decode('utf-8')

    question_count = int(redis_conn.get(f'{poll_id}:question_count').decode('utf-8'))
    keys_to_delete = [
        f'{poll_id}:revealed',
        f'{poll_id}:anonymous',
        f'{poll_id}:question_count',
        f'{creation_id}:poll_id'
    ]   
    for i in range(question_count):
        keys_to_delete.append(f'{poll_id}:q{i}:metadata')   
    for key in keys_to_delete:
        redis_conn.delete(key)  
    return True