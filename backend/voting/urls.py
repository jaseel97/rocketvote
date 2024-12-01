from django.urls import include, path

from . import auth
from . import views

urlpatterns = [
    path("templates", views.templates, name="index"),
    path("create", views.create, name="create_poll"),
    path("create/<str:creation_id>", views.poll_admin, name="poll_admin"),
    path("<str:poll_id>", views.cast_vote, name="participant_functions"),

    path('oauth2/callback', auth.oauth_callback, name='oauth_callback'),
    path('auth/verify', auth.verify_auth, name='verify-active-session'),
    path('auth/user', views.get_user_details, name="user_details")
]