import os
import json
import hashlib
from nanoid import generate
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .auth import is_authenticated
from .tasks import delete_poll
from .utils import get_poll, get_poll_from_creation_id, get_poll_results, make_poll_metadata_string
from .models import PollTemplate
from .redis_pool import get_redis_connection


required_fields = ['type', 'revealed', 'multi_selection', 'options', 'description']
result_limit = 12

template_required_fields = ['title', 'template']
poll_required_fields = ['questions', 'anonymous', 'revealed']
question_required_fields = ['multi_selection', 'options', 'description']

delete_seconds = int(os.getenv('AUTO_DELETE_DAYS', '10'))*24*60*60

@csrf_exempt
@is_authenticated
def templates(request):
    if request.method == 'GET':
        try:
            query = request.GET.get('search', '')
            results = PollTemplate.objects.filter(title__icontains=query, created_by=request.user['object_id']) if query else PollTemplate.objects.filter(created_by=request.user['object_id'])
            response = {result.title: json.loads(result.template) for result in results[:12]}
            return JsonResponse(response, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            request_body = json.loads(request.body)

            if not all(field in request_body for field in template_required_fields):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            if not all(field in request_body['template'] for field in poll_required_fields):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            for question in request_body['template']['questions']:
                if not all(field in question for field in question_required_fields):
                    return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            new_template = PollTemplate(
                title=request_body['title'],
                template=json.dumps(request_body),
                created_by = request.user['object_id']
            )
            new_template.save()

            return JsonResponse({'message': 'Template created successfully!'}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE':
        try:
            input_data = json.loads(request.body)
            template_title = input_data.get('title')

            if not template_title:
                return JsonResponse({'error': 'Title is required to delete a template'}, status=400)

            try:
                template = PollTemplate.objects.get(title=template_title, created_by=request.user['object_id'])
                template.delete()
                return JsonResponse({'message': f'Template with title "{template_title}" deleted successfully!'}, status=200)

            except PollTemplate.DoesNotExist:
                return JsonResponse({'error': f'Template with title "{template_title}" not found'}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


# takes the poll metadata from the UI and creates a new poll
@csrf_exempt
@is_authenticated
def create(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    
    try:
        poll_body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)

    # validate top-level required fields
    required_fields = ['questions', 'revealed', 'anonymous']
    for field in required_fields:
        if field not in poll_body:
            return JsonResponse({'error': f'Missing required field: {field}'}, status=400)

    if not isinstance(poll_body['questions'], list) or len(poll_body['questions']) == 0:
        return JsonResponse({'error': 'Questions must be a non-empty list'}, status=400)

    # validate fields for each question
    for i, question in enumerate(poll_body['questions']):
        required_question_fields = ['description', 'options', 'multi_selection']
        for field in required_question_fields:
            if field not in question:
                return JsonResponse(
                    {'error': f'Missing required field "{field}" in question {i+1}'}, 
                    status=400
                )
        
        if not isinstance(question['options'], list) or len(question['options']) == 0:
            return JsonResponse(
                {'error': f'Options must be a non-empty list in question {i+1}'}, 
                status=400
            )
        
        if len(question['options']) != len(set(question['options'])):
            return JsonResponse(
                {'error': f'Duplicate options are not allowed in question {i+1}'}, 
                status=400
            )

    creation_id = generate()
    new_poll_id = generate(size=8)  # for shareable URL
    
    try:
        redis_conn = get_redis_connection()
        
        # save poll-level attributes
        redis_conn.set(f'{new_poll_id}:revealed', poll_body['revealed'])
        redis_conn.set(f'{new_poll_id}:anonymous', poll_body['anonymous'])
        
        # save questions
        for idx, question in enumerate(poll_body['questions']):
            question_metadata_key = f'{new_poll_id}:q{idx}:metadata'
            options = "-:-".join(question['options'])
            question_metadata = f"{question['description']}-;-{question['multi_selection']}-;-{options}"
            redis_conn.set(question_metadata_key, question_metadata)

        # save question count
        redis_conn.set(f'{new_poll_id}:question_count', len(poll_body['questions']))
        
        # creation ID to poll ID mapping
        creation_to_poll_key = f'{creation_id}:poll_id'
        redis_conn.set(creation_to_poll_key, new_poll_id)

    except Exception as e:
        return JsonResponse({'error': f'Failed to save poll data: {str(e)}'}, status=500)

    return JsonResponse(
        {
            'poll_id': new_poll_id,
            'redirect_url': f'/create/{creation_id}'
        },
        status=201
    )

@csrf_exempt
@is_authenticated
@csrf_exempt 
@is_authenticated
def cast_vote(request, poll_id):
    if request.method not in ['PATCH', 'GET']:
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    
    redis_conn = get_redis_connection()
    
    if request.method == 'GET':
        poll = get_poll(redis_conn, poll_id)
        if poll is None:
            return JsonResponse({'error': 'Poll Expired/Ended'}, status=400)
        
        if poll['revealed'] == '1':
            poll_results = get_poll_results(redis_conn, poll_id)
            response = {
                'metadata': poll,
                'results': poll_results
            }
            return JsonResponse(response, status=200)
        else:
            response = {
                'metadata': poll,
            }
            return JsonResponse(response, status=200)

    elif request.method == 'PATCH':
        try:
            poll = get_poll(redis_conn, poll_id)
            if poll is None or poll['revealed'] == '1':
                return JsonResponse({'error': 'Poll Expired/Ended'}, status=400)
        except:
            return JsonResponse({'error':'An unexpected error has occurred'}, status=500)
        
        try:
            ballot = json.loads(request.body)
            if not isinstance(ballot, dict) or 'questions' not in ballot:
                return JsonResponse({'error': 'Invalid ballot format'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
        
        # Validate votes for each question
        for question_idx, question_votes in enumerate(ballot['questions']):
            if question_idx >= len(poll['questions']):
                return JsonResponse({'error': 'Invalid question index'}, status=400)
                
            question = poll['questions'][question_idx]
            votes = question_votes.get('votes', [])
            
            if question['multi_selection'] == '0' and len(votes) > 1:
                return JsonResponse({'error': f'Only one option can be chosen for question {question_idx + 1}'}, status=400)
            
            if not all(option in question['options'] for option in votes):
                return JsonResponse({'error': f'Invalid option in question {question_idx + 1}'}, status=400)
            
            if len(votes) != len(set(votes)):
                return JsonResponse({'error': f'Duplicate votes are not allowed in question {question_idx + 1}'}, status=400)

        if poll['anonymous'] == '1':
            user_email = request.user['email']
            voter_id = hashlib.sha256(f"{user_email}:{poll_id}".encode()).hexdigest()
        else:
            voter_id = request.user['email']

        try:
            for question_idx, question_votes in enumerate(ballot['questions']):
                votes = question_votes.get('votes', [])
                poll_votes_key = f'{poll_id}:q{question_idx}:votes'
                poll_count_key = f'{poll_id}:q{question_idx}:count'
                
                new_votes = '-:-'.join(votes)
                
                # remove previous votes, and update the count with new votes
                prev_votes = redis_conn.hget(poll_votes_key, voter_id)
                if prev_votes:
                    prev_votes = prev_votes.decode('utf-8').split('-:-')
                    for option in prev_votes:
                        redis_conn.zincrby(poll_count_key, -1, option)
                
                redis_conn.hset(poll_votes_key, voter_id, new_votes)

                for option in votes:
                    redis_conn.zincrby(poll_count_key, 1, option)
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'poll_{poll_id}',
                {
                    'type': 'poll_voted',
                }
            )
                    
        except Exception as e:
            return JsonResponse({'error': f'Failed to save poll data: {str(e)}'}, status=500)
        
        return JsonResponse({'message': 'Votes cast successfully'}, status=200)

@csrf_exempt
@is_authenticated
def poll_admin(request, creation_id):
    redis_conn = get_redis_connection()
    if request.method == "GET":
        poll_id, poll = get_poll_from_creation_id(redis_conn, creation_id)
        if poll is None:
            return JsonResponse({'error': 'Invalid creation ID'}, status=400)
        
        poll_results = get_poll_results(redis_conn, poll_id)
        
        response = {
            'metadata': poll,
            'results': poll_results
        }
        return JsonResponse(response, status=200)
        
    elif request.method == "PATCH":
        poll_id, poll = get_poll_from_creation_id(redis_conn, creation_id)
        if poll is None:
            return JsonResponse({'error': 'Invalid creation ID'}, status=400)
        
        question_count = redis_conn.get(f'{poll_id}:question_count')
        if question_count is None:
            return JsonResponse({'error': 'Invalid poll data'}, status=400)
            
        question_count = int(question_count.decode('utf-8'))
        
        try:
            # Store the revealed status at poll level
            redis_conn.set(f'{poll_id}:revealed', '1')

            # Schedule auto delete
            task = delete_poll.apply_async((creation_id,), countdown=delete_seconds)
            print(f"Scheduled delete task with ID: {task.id}")
            
            # Send revealed event to participants
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'poll_{poll_id}',
                {
                    'type': 'poll_revealed',
                }
            )
        except Exception as e:
            return JsonResponse({'error': f'Failed to update poll data: {str(e)}'}, status=500)

        return JsonResponse({'message': 'Poll results revealed'}, status=200)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

@is_authenticated
def get_user_details(request):
    user_details = {
        'name': request.user['name'],
        'email': request.user['email'],
        'object_id': request.user['object_id']
    }
    return JsonResponse(user_details)

