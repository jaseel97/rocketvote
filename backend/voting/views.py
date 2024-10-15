from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
import json
from .models import PollTemplate

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

            required_fields = ['type', 'options', 'revealed', 'multi_selection']
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