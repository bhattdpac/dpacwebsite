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

class ResearchPaper(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='research_papers/')
    abstract = models.TextField(blank=True, null=True)
    methodology = models.TextField(blank=True, null=True)
    findings = models.TextField(blank=True, null=True)
    research_gap = models.TextField(blank=True, null=True)
    dataset_notes = models.TextField(blank=True, null=True)
    implementation_status = models.CharField(max_length=50, default='NOT_IMPLEMENTED')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='research_papers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Publication(models.Model):
    STATUS_CHOICES = (
        ('UNDER_REVIEW', 'Under Review'),
        ('ACCEPTED', 'Accepted'),
        ('PUBLISHED', 'Published'),
    )
    title = models.CharField(max_length=255)
    authors = models.CharField(max_length=255)
    venue = models.CharField(max_length=255)
    year = models.IntegerField()
    abstract = models.TextField(blank=True, null=True)
    doi = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNDER_REVIEW')
    file_url = models.URLField(blank=True, null=True)
    citation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.year})"

class ResearchObjective(models.Model):
    STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    )
    num = models.CharField(max_length=5) # e.g. "01", "02"
    title = models.CharField(max_length=255)
    description = models.TextField()
    progress_percentage = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Objective {self.num}: {self.title}"

class Experiment(models.Model):
    title = models.CharField(max_length=255)
    goal = models.TextField()
    dataset = models.CharField(max_length=255, blank=True, null=True)
    model_details = models.CharField(max_length=255) # e.g., "AirLLM + LLaMA-3-70B"
    metrics = models.JSONField(default=dict) # e.g. {"accuracy": 0.89, "vram_limit": "4GB"}
    observations = models.TextField()
    future_work = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ResearchLog(models.Model):
    week_number = models.IntegerField()
    date = models.DateField()
    achievements = models.TextField()
    blockers = models.TextField(blank=True, null=True)
    next_goals = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Week {self.week_number} Log"

class Course(models.Model):
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    description = models.TextField()
    syllabus_file = models.FileField(upload_to='syllabi/', blank=True, null=True)
    resource_links = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code}: {self.title}"

class Resource(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    file_type = models.CharField(max_length=50)
    file_url = models.URLField(blank=True, null=True)
    downloads_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title



