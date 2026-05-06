from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Document, Clause, SmartContractTemplate, ContractProposal, ResearchPaper

User = get_user_model()

class ResearchPaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchPaper
        fields = ('id', 'title', 'file', 'abstract', 'methodology', 'findings', 'owner', 'created_at')
        read_only_fields = ('owner', 'created_at', 'abstract', 'methodology', 'findings')

class ClauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clause
        fields = ('id', 'document', 'text', 'type', 'explanation', 'is_approved', 'metadata', 'confidence', 'fairness_score', 'fairness_notes', 'created_at')

class SmartContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartContractTemplate
        fields = '__all__'

class ContractProposalSerializer(serializers.ModelSerializer):
    template_details = SmartContractTemplateSerializer(source='template', read_only=True)
    document_status = serializers.CharField(source='document.status', read_only=True)
    pending_clause_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ContractProposal
        fields = '__all__'

    def get_pending_clause_count(self, obj):
        return obj.document.clauses.filter(is_approved=False).count()

class DocumentSerializer(serializers.ModelSerializer):
    clause_count = serializers.IntegerField(source='clauses.count', read_only=True)
    pending_clause_count = serializers.SerializerMethodField()
    proposal = ContractProposalSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = ('id', 'title', 'file', 'owner', 'status', 'created_at', 'clause_count', 'pending_clause_count', 'proposal')
        read_only_fields = ('owner', 'status', 'created_at')

    def get_pending_clause_count(self, obj):
        return obj.clauses.filter(is_approved=False).count()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'role', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'LAWYER'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user
