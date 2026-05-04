from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Clause, SmartContractTemplate, Document
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

        # Ensure Base Template exists
        SmartContractTemplate.objects.get_or_create(
            contract_name='BaseLegalContract', 
            defaults={'name': 'Base Legal Contract', 'sol_path': 'blockchain/contracts/templates/BaseLegalContract.sol'}
        )

    def test_lawyer_can_upload_document(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url = reverse('document-list')
        
        # Mock file with enough content for NLP
        file_content = b"This is a long test legal document that must contain at least thirty characters to be processed by the NLP engine correctly."
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

    def test_client_cannot_approve_own_clause(self):
        # Lawyer uploads
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        url_upload = reverse('document-list')
        res_upload = self.client.post(url_upload, {
            'title': 'Doc with clauses',
            'file': SimpleUploadedFile("test.txt", b"The tenant shall pay exactly 2.5 ETH monthly as rent to the landlord's wallet.")
        }, format='multipart')
        doc_id = res_upload.data['id']
        
        # Ensure clause was created
        self.assertTrue(Clause.objects.filter(document_id=doc_id).exists())
        clause_id = Clause.objects.filter(document_id=doc_id).first().id
        
        # Client tries to approve it
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')
        url_clause_detail = reverse('clause-detail', args=[clause_id])
        # Returns 403 because they are not a Lawyer
        response = self.client.patch(url_clause_detail, {'is_approved': True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_can_approve_proposal_but_not_edit_code(self):
        # Lawyer uploads and generates proposal
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.lawyer_token}')
        res_upload = self.client.post(reverse('document-list'), {
            'title': 'Proposal Doc',
            'file': SimpleUploadedFile("test.txt", b"The tenant shall pay exactly 2.5 ETH monthly as rent to the landlord's wallet.")
        }, format='multipart')
        doc_id = res_upload.data['id']
        
        # Approve clauses
        Clause.objects.filter(document_id=doc_id).update(is_approved=True)
        
        # Generate proposal
        self.client.post(reverse('document-proposal', args=[doc_id]))
        
        # Get proposal
        res_prop = self.client.get(reverse('document-proposal', args=[doc_id]))
        self.assertIn('id', res_prop.data)
        prop_id = res_prop.data['id']
        
        # Client tries to edit code (returns 404 since they don't own the doc)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')
        url_prop_detail = reverse('proposal-detail', args=[prop_id])
        response = self.client.patch(url_prop_detail, {'generated_code': 'HACKED'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Re-assign document to client to test permission logic (if they owned it)
        Document.objects.filter(id=doc_id).update(owner=self.client_user)
        
        # Client tries to edit code (Now 403 by PermissionDenied in perform_update)
        response = self.client.patch(url_prop_detail, {'generated_code': 'HACKED'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Client approves proposal (Allowed)
        response = self.client.patch(url_prop_detail, {'client_approved': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
