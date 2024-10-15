from django.db import models

# Create your models here.
class PollTemplate(models.Model):
    title = models.TextField()
    template = models.TextField()