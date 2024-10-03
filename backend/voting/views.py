from django.http import HttpResponse, JsonResponse


def index(request):
    response = [
        {
            "description" : "story sizing",
            "type" : "fibonacci",
            "options" : ["1","2","3","5","8","13+"]
        },
        {
            "description" : "story sizing",
            "type" : "tshirt",
            "options" : ["S","M","L","XL","XXL"]
        }
    ]

    return HttpResponse(JsonResponse(response, safe=False))