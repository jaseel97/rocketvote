from django.urls import path

from . import views

urlpatterns = [
    path("templates", views.templates, name="index"),
    path("create", views.create, name="create_poll"),
    path("<str:poll_id>", views.cast_vote, name="cast_vote")
]