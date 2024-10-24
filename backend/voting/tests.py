from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock
from voting.models import PollTemplate
import json


class VotingViewsTest(TestCase):
    def setUp(self):
        # Create a test client
        self.client = Client()

        # Create a test PollTemplate
        self.poll_template = PollTemplate.objects.create(
            title="fibonacci",
            template='{"type": "fibonacci", "options": ["1", "2", "3", "5", "8", "13"], "revealed": 0, "multi_selection": 0}'
        )

    def test_get_templates(self):
        """Test the GET method for the /templates endpoint"""
        response = self.client.get(reverse('index'))  # 'index' is the correct name for the templates URL
        self.assertEqual(response.status_code, 200)
        self.assertIn("fibonacci", response.json())

    def test_post_templates_valid(self):
        """Test the POST method for creating a valid template"""
        new_template = {
            "type": "new_template",
            "options": ["1", "2", "3"],
            "revealed": 0,
            "multi_selection": 0
        }
        response = self.client.post(reverse('index'), data=json.dumps(new_template), content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['message'], 'Template created successfully!')

    def test_post_templates_missing_field(self):
        """Test the POST method with missing required fields"""
        incomplete_template = {
            "type": "new_template",
            # Missing 'options', 'revealed', 'multi_selection'
        }
        response = self.client.post(reverse('index'), data=json.dumps(incomplete_template), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    @patch('voting.views.get_redis_connection')
    def test_create_poll_valid(self, mock_redis_conn):
        """Test creating a valid poll"""
        mock_redis = MagicMock()
        mock_redis_conn.return_value = mock_redis

        poll_data = {
            "type": "fibonacci",
            "revealed": 0,
            "multi_selection": 0,
            "options": ["1", "2", "3", "5", "8", "13"],
            "description": "Fibonacci Poll"
        }

        response = self.client.post(reverse('create_poll'), data=json.dumps(poll_data), content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertIn('poll_id', response.json())

    @patch('voting.views.get_redis_connection')
    def test_create_poll_missing_fields(self, mock_redis_conn):
        """Test creating a poll with missing required fields"""
        poll_data = {
            "type": "fibonacci",
            # Missing 'options', 'description'
        }

        response = self.client.post(reverse('create_poll'), data=json.dumps(poll_data), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    @patch('voting.views.get_redis_connection')
    def test_create_poll_duplicate_options(self, mock_redis_conn):
        """Test creating a poll with duplicate options"""
        mock_redis = MagicMock()
        mock_redis_conn.return_value = mock_redis

        poll_data = {
            "type": "fibonacci",
            "revealed": 0,
            "multi_selection": 0,
            "options": ["1", "1", "3", "5", "8", "13"],  # Duplicate "1"
            "description": "Fibonacci Poll"
        }

        response = self.client.post(reverse('create_poll'), data=json.dumps(poll_data), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Duplicate options are not allowed')

    @patch('voting.views.get_redis_connection')
    def test_cast_vote_invalid_method(self, mock_redis_conn):
        """Test casting vote with invalid HTTP method"""
        response = self.client.post(reverse('participant_functions', kwargs={'poll_id': 'some_poll_id'}))
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    @patch('voting.views.get_redis_connection')
    def test_cast_vote_get_valid_poll(self, mock_redis_conn):
        """Test casting vote via GET method when poll exists"""
        mock_redis = MagicMock()
        mock_redis_conn.return_value = mock_redis

        poll_data = {
            "description": "A sample poll",
            "type": "fibonacci",
            "revealed": "0",
            "multi_selection": "0",
            "options": ["1", "2", "3", "5", "8", "13"]
        }

        # Serialize the poll data to match what Redis would store
        poll_metadata = f"{poll_data['description']}-;-{poll_data['type']}-;-{poll_data['revealed']}-;-{poll_data['multi_selection']}-;-{'-:-'.join(poll_data['options'])}"

        # Mock the Redis call to return this serialized string
        mock_redis.get.return_value = poll_metadata

        # Make the request and check the response
        response = self.client.get(reverse('participant_functions', kwargs={'poll_id': 'some_poll_id'}))

        self.assertEqual(response.status_code, 200)
        self.assertIn('metadata', response.json())

    @patch('voting.views.get_redis_connection')
    def test_cast_vote_invalid_poll_id(self, mock_redis_conn):
        """Test casting vote via GET method with an invalid poll ID"""
        mock_redis = MagicMock()
        mock_redis_conn.return_value = mock_redis

        mock_redis.get.return_value = None  # Simulate poll not found

        response = self.client.get(reverse('participant_functions', kwargs={'poll_id': 'invalid_poll_id'}))
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Poll Expired/Ended')
