from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
import io

User = get_user_model()

class RBACTests(APITestCase):
    def setUp(self):
        self.lawyer = User.objects.create_user(
            username='lawyer_test',
            password='password123',
            role='LAWYER'
        )
        self.client_user = User.objects.create_user(
            username='client_test',
            password='password123',
            role='CLIENT'
        )
        
        # Helper to get tokens
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'lawyer_test',
            'password': 'password123'
        })
        self.lawyer_token = response.data['access']
        
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'client_test',
            'password': 'password123'
        })
        self.client_token = response.data['access']

    def test_lawyer_can_upload_document(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url = reverse('document-list')
        
        # Mock file
        file_content = b"This is a test legal document with a payment clause."
        test_file = SimpleUploadedFile("test.txt", file_content, content_type="text/plain")
        
        data = {
            'title': 'Test Document',
            'file': test_file
        }
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_cannot_upload_document(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')
        url = reverse('document-list')
        
        data = {
            'title': 'Test Document',
            'file': SimpleUploadedFile("test.txt", b"test content")
        }
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_delete_document(self):
        # First, lawyer uploads a doc
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url_upload = reverse('document-list')
        res_upload = self.client.post(url_upload, {
            'title': 'Doc to delete',
            'file': SimpleUploadedFile("test.txt", b"content")
        }, format='multipart')
        doc_id = res_upload.data['id']
        
        # Now client tries to delete it
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')
        url_delete = reverse('document-detail', args=[doc_id])
        response = self.client.delete(url_delete)
        # It returns 403 because we added IsLawyer permission to 'destroy' action
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lawyer_can_delete_own_document(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url_upload = reverse('document-list')
        res_upload = self.client.post(url_upload, {
            'title': 'My Doc',
            'file': SimpleUploadedFile("test.txt", b"content")
        }, format='multipart')
        doc_id = res_upload.data['id']
        
        url_delete = reverse('document-detail', args=[doc_id])
        response = self.client.delete(url_delete)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_client_cannot_deploy_contract(self):
        # First, lawyer uploads a doc
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url_upload = reverse('document-list')
        res_upload = self.client.post(url_upload, {
            'title': 'Doc to deploy',
            'file': SimpleUploadedFile("test.txt", b"content")
        }, format='multipart')
        doc_id = res_upload.data['id']
        
        # Now client tries to deploy it
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')
        url_deploy = reverse('document-deploy', args=[doc_id])
        response = self.client.post(url_deploy)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
