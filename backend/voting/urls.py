from django.urls import include, path

from . import views

urlpatterns = [
    path("templates", views.templates, name="index"),
    path("create", views.create, name="create_poll"),
    path("create/<str:creation_id>", views.poll_admin, name="poll_admin"),
    path("<str:poll_id>", views.cast_vote, name="cast_vote"),
]