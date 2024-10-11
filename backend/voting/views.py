import json
from django.http import HttpResponse, JsonResponse

from voting.models import PollTemplate # type: ignore


def templates(request):
    if request.method == 'GET':
        templates =  PollTemplate.objects.all()
        print('templates = ', templates)
        response = [[template[0],json.dumps(template[1])] for template in templates]
        print('responses = ', response)
        return HttpResponse(JsonResponse(response, safe=False))
  
    elif request.method == 'POST':
        return HttpResponse(status = 200)
    


    