from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from api.views import health_check, register_user, get_current_user, DocumentViewSet, ClauseViewSet, ContractProposalViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'clauses', ClauseViewSet, basename='clause')
router.register(r'proposals', ContractProposalViewSet, basename='proposal')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/register/', register_user, name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', get_current_user, name='current_user'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
