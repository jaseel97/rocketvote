from django.http import HttpResponse, HttpResponseServerError, JsonResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt

import json
from nanoid import generate

from .utils import get_poll
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
    try:
        if request.method != 'POST':
            return HttpResponseBadRequest('Invalid request method')

        try:
            poll_body = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON payload')

        if not all(field in poll_body for field in required_fields):
            return HttpResponseBadRequest('Missing required fields')

        if not isinstance(poll_body['options'], list) or len(poll_body['options']) == 0:
            return HttpResponseBadRequest('Options must be a non-empty list')

        creation_id = generate()
        new_poll_id = generate(size=7) # for shareable url

        poll_metadata_key = f'{new_poll_id}:metadata'
        options = "-:-".join(poll_body['options'])
        poll_metadata = f"{poll_body['type']}-;-{poll_body['revealed']}-;-{poll_body['multi_selection']}-;-{options}"

        try:
            redis_conn = get_redis_connection()
            redis_conn.set(poll_metadata_key, poll_metadata)
            creation_to_poll_key = f'{creation_id}:poll_id'
            redis_conn.set(creation_to_poll_key, new_poll_id)
        except Exception as e:
            return HttpResponseServerError(f"Failed to save poll data: {str(e)}")

        return JsonResponse(
            {
                'poll_id' : new_poll_id,
                'redirect_url': f'/create/{creation_id}'
            }, 
            status=302
        )

    except Exception as e:
        return HttpResponseServerError(f"An unexpected error occurred: {str(e)}")

@csrf_exempt
def cast_vote(request, poll_id):
    if request.method != 'PATCH':
        return HttpResponseBadRequest('Invalid request method')
    
    poll = get_poll(poll_id)
    if poll is None or poll['revealed'] == '1':
        return HttpResponseBadRequest('Poll Expired/Ended')
    
    try:
        ballot = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponseBadRequest('Invalid JSON payload')
    
    if not all(field in poll['options'] for field in ballot['votes']):
        return HttpResponseBadRequest('Invalid option')

    if len(ballot['votes']) != len(set(ballot['votes'])):
        return HttpResponseBadRequest('Duplicate votes are not allowed')

    try:
        ballot['voter']
    except:
        return HttpResponseBadRequest('Missing username')
    
    poll_votes_key = f'{poll_id}:votes'
    poll_count_key = f'{poll_id}:count'

    voter_name = ballot['voter']
    new_votes = '-:-'.join(ballot['votes'])

    try:
        redis_conn = get_redis_connection()

        prev_votes = redis_conn.hget(poll_votes_key, voter_name)
        if prev_votes:
            prev_votes = prev_votes.decode('utf-8').split('-:-')
            for option in prev_votes:
                redis_conn.zincrby(poll_count_key, -1, option)

        redis_conn.hset(poll_votes_key, voter_name, new_votes)

        for option in ballot['votes']:
            redis_conn.zincrby(poll_count_key, 1, option)
    except Exception as e:
        return HttpResponseServerError(f"Failed to save poll data: {str(e)}")
    
    return HttpResponse('Vote/s cast successfully', 200)

