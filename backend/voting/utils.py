def get_poll(redis_conn, poll_id):
    question_count = redis_conn.get(f'{poll_id}:question_count')
    if question_count is None:
        return None
    
    revealed = redis_conn.get(f'{poll_id}:revealed')
    revealed = revealed.decode('utf-8') if revealed else '0'
    
    anonymous = redis_conn.get(f'{poll_id}:anonymous')
    anonymous = anonymous.decode('utf-8') if anonymous else '0'
    
    questions = []
    question_count = int(question_count.decode('utf-8'))
    
    for i in range(question_count):
        question_string = redis_conn.get(f'{poll_id}:q{i}:metadata')
        if question_string is None:
            continue
            
        question = parse_poll_metadata_string(question_string.decode('utf-8'))
        if question:
            questions.append(question)
    
    if not questions:
        return None
        
    return {
        'questions': questions,
        'revealed': revealed,
        'anonymous': anonymous
    }

def get_poll_from_creation_id(redis_conn, creation_id):
    poll_id = redis_conn.get(f'{creation_id}:poll_id')
    if poll_id is None:
        return None
    return poll_id.decode('utf-8'), get_poll(redis_conn, poll_id.decode('utf-8'))

def parse_poll_metadata_string(poll_string):
    if not poll_string or not isinstance(poll_string, str):
        print("Invalid poll string format")
        return None 

    try:
        params = poll_string.split('-;-')
        if len(params) < 3:
            print("Incomplete poll string")
            return None

        description, multi_selection, options = params
        options_list = options.split("-:-")

        return {
            'description': description,
            'multi_selection': multi_selection,
            'options': options_list
        }

    except Exception as e:
        print(f"Error while parsing poll string: {str(e)}")
        return None

def make_poll_metadata_string(question):
    options = "-:-".join(question['options'])
    poll_string = f"{question['description']}-;-{question['multi_selection']}-;-{options}"
    return poll_string

def get_poll_results(redis_conn, poll_id):
    question_count = redis_conn.get(f'{poll_id}:question_count')
    if question_count is None:
        return None
        
    question_count = int(question_count.decode('utf-8'))
    results = []
    
    for i in range(question_count):
        votes = redis_conn.hgetall(f'{poll_id}:q{i}:votes')
        if votes:
            votes = {key.decode('utf-8'): value.decode('utf-8').split("-:-") for key, value in votes.items()}
        else:
            votes = {}

        counts = redis_conn.zrevrange(f'{poll_id}:q{i}:count', 0, -1, withscores=True)
        if counts:
            counts = {option.decode('utf-8'): int(score) for option, score in counts}
        else:
            counts = {}

        results.append({
            'votes': votes,
            'counts': counts
        })
    
    return results