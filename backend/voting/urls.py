from django.urls import path

from . import views

urlpatterns = [
    path("templates", views.templates, name="index"),
    path("create", views.create, name="create_poll"),
]