from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('LAWYER', 'Lawyer'),
        ('CLIENT', 'Client'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='LAWYER')

    def __str__(self):
        return f"{self.username} ({self.role})"

class Document(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='legal_documents/')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Clause(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='clauses')
    text = models.TextField()
    type = models.CharField(max_length=50, default='GENERAL')
    explanation = models.TextField(blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict)
    confidence = models.FloatField(default=1.0)
    fairness_score = models.FloatField(default=1.0) # 1.0 = highly fair/balanced
    fairness_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.document.title}"

class SmartContractTemplate(models.Model):
    name = models.CharField(max_length=100)
    contract_name = models.CharField(max_length=100)
    description = models.TextField()
    required_params = models.JSONField(default=list) # e.g., ['payer', 'payee', 'amount']
    sol_path = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class ContractProposal(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='proposal')
    template = models.ForeignKey(SmartContractTemplate, on_delete=models.SET_NULL, null=True)
    parameters = models.JSONField(default=dict)
    generated_code = models.TextField(blank=True, null=True)
    client_explanation = models.TextField(blank=True, null=True)
    client_approved = models.BooleanField(default=False)
    contract_address = models.CharField(max_length=42, blank=True, null=True)
    transaction_hash = models.CharField(max_length=66, blank=True, null=True)
    is_ready_for_deployment = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proposal for {self.document.title}"
