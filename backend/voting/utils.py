from .redis_pool import get_redis_connection

def get_poll(redis_conn, poll_id):
        poll_string = redis_conn.get(f'{poll_id}:metadata')

        if poll_string is None:
            return None

        poll = parse_poll_metadata_string(poll_string.decode('utf-8'))
        return poll

def get_poll_from_creation_id(redis_conn, creation_id):
    poll_id = redis_conn.get(f'{creation_id}:poll_id')
    if poll_id is None:
        return None  # Return None if creation ID does not exist

    poll = get_poll(redis_conn, poll_id.decode('utf-8'))
    if poll is None:
        return None  # Return None if poll metadata is missing

    return poll_id.decode('utf-8'), poll

def parse_poll_metadata_string(poll_string):
    if not poll_string or not isinstance(poll_string, str):
        print("Invalid poll string format")
        return None 

    try:
        params = poll_string.split('-;-')
        if len(params) < 5:
            print("Incomplete poll string")
            return None

        description, poll_type, revealed, multi_selection, options = params
        options_list = options.split("-:-")

        return {
            'description': description,
            'type': poll_type,
            'revealed': revealed,
            'multi_selection': multi_selection,
            'options': options_list
        }

    except Exception as e:
        print(f"Error while parsing poll string: {str(e)}")
        return None
    
def make_poll_metadata_string(poll):
    options = "-:-".join(poll['options'])
    poll_string = f"{poll['description']}-;-{poll['type']}-;-{poll['revealed']}-;-{poll['multi_selection']}-;-{options}"
    return poll_string

def get_poll_results(redis_conn, poll_id):
    votes = redis_conn.hgetall(f'{poll_id}:votes')
    if votes:
        votes = {key.decode('utf-8'): value.decode('utf-8').split("-:-") for key, value in votes.items()}

    counts = redis_conn.zrevrange(f'{poll_id}:count', 0, -1, withscores=True)
    if counts:
        counts = {option.decode('utf-8'): int(score) for option, score in counts}

    return [votes, counts]
