from django.urls import path

from . import views

urlpatterns = [
    path("templates", views.index, name="index"),
]