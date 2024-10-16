from .redis_pool import get_redis_connection

def get_poll(poll_id):
    redis_conn = get_redis_connection()
    poll_string = redis_conn.get(f'{poll_id}:metadata')

    if poll_string is None:
        return None
    
    poll = parse_poll_string(poll_string.decode('utf-8'))
    return poll

def parse_poll_string(poll_string):
    if not poll_string or not isinstance(poll_string, str):
        print("Invalid poll string format")
        return None 

    try:
        params = poll_string.split('-;-')
        if len(params) < 4:
            print("Incomplete poll string")
            return None

        poll_type, revealed, multi_selection, options = params
        options_list = options.split("-:-")

        return {
            'type': poll_type,
            'revealed': revealed,
            'multi_selection': multi_selection,
            'options': options_list
        }

    except Exception as e:
        print(f"Error while parsing poll string: {str(e)}")
        return None