from django.http import HttpResponse, HttpResponseServerError, JsonResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt

import json
from nanoid import generate

from .utils import get_poll, get_poll_from_creation_id, get_poll_results, make_poll_metadata_string
from .models import PollTemplate
from .redis_pool import get_redis_connection

required_fields = ['type', 'options', 'revealed', 'multi_selection']

@csrf_exempt
def templates(request):
    if request.method == 'GET':
        try:
            results = PollTemplate.objects.all()
            response = {}
            for result in results:
                response[result.title] = json.loads(result.template)
            return JsonResponse(response, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            input_template = json.loads(request.body)

            if not all(field in input_template for field in required_fields):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            new_template = PollTemplate(
                title=input_template['type'],
                template=json.dumps(input_template)
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
                template = PollTemplate.objects.get(title=template_title)
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



# takes the poll meta data from the UI and creates a new poll
@csrf_exempt
def create(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=400)

    try:
        poll_body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)

    required_fields = ['type', 'revealed', 'multi_selection', 'options', 'description']
    if not all(field in poll_body for field in required_fields):
        return JsonResponse({'error': 'Missing required fields'}, status=400)

    if not isinstance(poll_body['options'], list) or len(poll_body['options']) == 0:
        return JsonResponse({'error': 'Options must be a non-empty list'}, status=400)
    
    if len(poll_body['options']) != len(set(poll_body['options'])):
        return JsonResponse({'error': 'Duplicate options are not allowed'}, status=400)

    creation_id = generate()
    new_poll_id = generate(size=8)  # for shareable URL

    poll_metadata_key = f'{new_poll_id}:metadata'
    options = "-:-".join(poll_body['options'])
    poll_metadata = f"{poll_body['description']}-;-{poll_body['type']}-;-{poll_body['revealed']}-;-{poll_body['multi_selection']}-;-{options}"

    try:
        redis_conn = get_redis_connection()
        redis_conn.set(poll_metadata_key, poll_metadata)
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
                'counts' : poll_results[1]
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
            return JsonResponse({'error':'An unexpected error has occured'}, status=500)

        try:
            ballot = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload'}, status=400)

        if not all(field in poll['options'] for field in ballot['votes']):
            return JsonResponse({'error': 'Invalid option'}, status=400)

        if len(ballot['votes']) != len(set(ballot['votes'])):
            return JsonResponse({'error': 'Duplicate votes are not allowed'}, status=400)

        if 'voter' not in ballot:
            return JsonResponse({'error': 'Missing username'}, status=400)

        poll_votes_key = f'{poll_id}:votes'
        poll_count_key = f'{poll_id}:count'

        voter_name = ballot['voter']
        new_votes = '-:-'.join(ballot['votes'])

        try:
            prev_votes = redis_conn.hget(poll_votes_key, voter_name)
            if prev_votes:
                prev_votes = prev_votes.decode('utf-8').split('-:-')
                for option in prev_votes:
                    redis_conn.zincrby(poll_count_key, -1, option)

            redis_conn.hset(poll_votes_key, voter_name, new_votes)

            for option in ballot['votes']:
                redis_conn.zincrby(poll_count_key, 1, option)
        except Exception as e:
            return JsonResponse({'error': f'Failed to save poll data: {str(e)}'}, status=500)

        return JsonResponse({'message': 'Vote/s cast successfully'}, status=200)

@csrf_exempt
def poll_admin(request, creation_id):
    redis_conn = get_redis_connection()

    if request.method == "GET":
        poll_id, poll = get_poll_from_creation_id(redis_conn, creation_id)
        if poll is None:
            return JsonResponse({'error': 'Invalid creation ID'}, status=400)
        
        poll_results = get_poll_results(redis_conn, poll_id)
        
        response = {
            'metadata': poll,
            'votes' : poll_results[0],
            'counts' : poll_results[1]
        }
        print("Response : ", response)
        return JsonResponse(response, status=200)

    elif request.method == "PATCH":
        poll_id, poll = get_poll_from_creation_id(redis_conn, creation_id)
        if poll is None:
            return JsonResponse({'error': 'Invalid creation ID'}, status=400)
        
        poll['revealed'] = 1
        poll_metadata = make_poll_metadata_string(poll)
        poll_metadata_key = f'{poll_id}:metadata'
        
        try:
            redis_conn.set(poll_metadata_key, poll_metadata)
            #TODO : send event through WS
        except Exception as e:
            return JsonResponse({'error': f'Failed to update poll data: {str(e)}'}, status=500)

        return JsonResponse({'message':'Poll results revealed'}, status=200)

    elif request.method == "DELETE":
        # Call delete_poll function
        if delete_poll(redis_conn, creation_id):
            return JsonResponse({'message': f'Poll with creation_id {creation_id} deleted successfully!'}, status=200)
        else:
            return JsonResponse({'error': 'Poll not found or already deleted'}, status=404)

    return JsonResponse({'error': 'Invalid request method'}, status=400)
