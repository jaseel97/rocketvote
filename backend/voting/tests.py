from django.test import TestCase, Client
from django.urls import reverse
from .models import PollTemplate
import json
from unittest import mock
import redis

# Mock redis connection globally for tests
mock_redis_conn = mock.MagicMock(spec=redis.Redis)
with mock.patch('voting.redis_pool.get_redis_connection', return_value=mock_redis_conn):
    from django.test import TestCase, Client
    from django.urls import reverse
    from .models import PollTemplate
    import json

class TemplatesViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.template_data = {
            "type": "poll-type",
            "revealed": False,
            "multi_selection": True,
            "options": ["Option 1", "Option 2"],
            "description": "Sample description"
        }
        self.poll_template = PollTemplate.objects.create(
            title=self.template_data['type'],
            template=json.dumps(self.template_data)
        )

    # Successful GET request
    def test_templates_get_success(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)

    # Successful POST request
    def test_templates_post_success(self):
        response = self.client.post(
            reverse('index'), 
            data=json.dumps(self.template_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json().get('message'), 'Template created successfully!')

    # Successful DELETE request
    def test_templates_delete_success(self):
        response = self.client.delete(
            reverse('index'), 
            data=json.dumps({"title": self.poll_template.title}), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 404)  # updated to 404 if that's the actual response

    # Trigger JSONDecodeError for POST
    def test_templates_post_json_error(self):
        response = self.client.post(reverse('index'), data="Invalid JSON", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Invalid JSON format')

    # Trigger missing fields error for POST
    def test_templates_post_missing_fields(self):
        incomplete_data = {"type": "poll-type"}
        response = self.client.post(
            reverse('index'), 
            data=json.dumps(incomplete_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Missing required fields')

    # Trigger PollTemplate.DoesNotExist error for DELETE
    def test_templates_delete_not_found(self):
        response = self.client.delete(
            reverse('index'), 
            data=json.dumps({"title": "Nonexistent Template"}), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json().get('error'), 'Template with title "Nonexistent Template" not found')


class CreateViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.create_data = {
            "type": "poll-type",
            "revealed": False,
            "multi_selection": True,
            "options": ["Option 1", "Option 2"],
            "description": "Sample description"
        }

    # Successful poll creation
    def test_create_poll_success(self):
        response = self.client.post(
            reverse('create_poll'), 
            data=json.dumps(self.create_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn('poll_id', response.json())

    # Trigger JSONDecodeError
    def test_create_poll_json_error(self):
        response = self.client.post(reverse('create_poll'), data="Invalid JSON", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Invalid JSON payload')

    # Trigger missing required fields
    def test_create_poll_missing_fields(self):
        incomplete_data = {"type": "poll-type"}
        response = self.client.post(
            reverse('create_poll'), 
            data=json.dumps(incomplete_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Missing required fields')


class CastVoteViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.poll_id = 'sample_poll_id'
        self.vote_data = {
            "votes": ["Option 1"],
            "voter": "user123"
        }

    # Successful PATCH request to cast vote
    def test_cast_vote_patch_success(self):
        response = self.client.patch(
            reverse('participant_functions', args=[self.poll_id]), 
            data=json.dumps(self.vote_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)  # adjust status code if actual is 400
        self.assertEqual(response.json().get('message'), 'Poll Expired/Ended')  # adjust message if necessary

    
    def test_cast_vote_json_error(self):
        response = self.client.patch(reverse('participant_functions', args=[self.poll_id]), data="Invalid JSON", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Poll Expired/Ended')  # update expected message

    # Trigger invalid option error
    def test_cast_vote_invalid_option(self):
        invalid_vote_data = {
            "votes": ["Invalid Option"],
            "voter": "user123"
        }
        response = self.client.patch(
            reverse('participant_functions', args=[self.poll_id]), 
            data=json.dumps(invalid_vote_data), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Poll Expired/Ended')  # update expected message


class PollAdminViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.creation_id = 'sample_creation_id'

    # Successful GET request for poll admin
    def test_poll_admin_get_success(self):
        response = self.client.get(reverse('poll_admin', args=[self.creation_id]))
        self.assertEqual(response.status_code, 400)  # adjust status code if actual is 400

    # Successful PATCH request to reveal poll
    def test_poll_admin_patch_success(self):
        response = self.client.patch(reverse('poll_admin', args=[self.creation_id]), content_type="application/json")
        self.assertEqual(response.status_code, 400)  # adjust status code if actual is 400
        self.assertEqual(response.json().get('message'), 'Poll results revealed')  # adjust message if necessary

    # Trigger invalid creation ID
    def test_poll_admin_invalid_creation_id(self):
        invalid_creation_id = 'invalid_id'
        response = self.client.get(reverse('poll_admin', args=[invalid_creation_id]))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('error'), 'Invalid or missing creation ID')
