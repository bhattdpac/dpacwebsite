from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from .serializers import RegisterSerializer, UserSerializer, DocumentSerializer, ClauseSerializer, ContractProposalSerializer
from .models import Document, Clause, ContractProposal
from .services import nlp_service, mapping_service, generation_service, deployment_service

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "healthy", "message": "Backend is operational"})

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        document = serializer.save(owner=self.request.user)
        # Trigger NLP processing (In a real app, this should be a background task)
        nlp_service.process_document(document)

    @action(detail=True, methods=['get'])
    def clauses(self, request, pk=None):
        document = self.get_object()
        clauses = document.clauses.all()
        serializer = ClauseSerializer(clauses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def proposal(self, request, pk=None):
        document = self.get_object()
        
        if request.method == 'POST':
            proposal = mapping_service.suggest_templates(document)
            if proposal:
                # Trigger code generation
                generation_service.generate_solidity_code(proposal)
            else:
                return Response({"error": "Could not generate proposal. Ensure clauses are approved."}, 
                                status=status.HTTP_400_BAD_REQUEST)
        
        try:
            proposal = document.proposal
            serializer = ContractProposalSerializer(proposal)
            return Response(serializer.data)
        except ContractProposal.DoesNotExist:
            return Response({"error": "No proposal found for this document."}, 
                            status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def deploy(self, request, pk=None):
        document = self.get_object()
        try:
            proposal = document.proposal
            if not proposal.client_approved:
                return Response({"error": "Client must approve the contract before deployment."}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            result = deployment_service.deploy_to_blockchain(proposal)
            if "error" in result:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response(result)
        except ContractProposal.DoesNotExist:
            return Response({"error": "No proposal found for this document."}, 
                            status=status.HTTP_404_NOT_FOUND)

class ClauseViewSet(viewsets.ModelViewSet):
    serializer_class = ClauseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Clause.objects.filter(document__owner=self.request.user)

class ContractProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ContractProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ContractProposal.objects.filter(document__owner=self.request.user)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
