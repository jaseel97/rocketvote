#!/bin/sh
python manage.py migrate
python manage.py createsuperuser --noinput || echo "Superuser already exists, skipping creation."

# CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8080", "rocketVoteAPI.wsgi:application"]
exec gunicorn --workers ${GUNICORN_WORKERS} --bind "0.0.0.0:${API_PORT}" rocketVoteAPI.asgi:application -k uvicorn.workers.UvicornWorker
