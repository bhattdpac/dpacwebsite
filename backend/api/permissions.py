from rest_framework import permissions
from rest_framework.request import Request
from django.views import View

class IsLawyer(permissions.BasePermission):
    """
    Allows access only to users with the LAWYER role.
    """
    def has_permission(self, request: Request, view: View) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == 'LAWYER')

class IsClient(permissions.BasePermission):
    """
    Allows access only to users with the CLIENT role.
    """
    def has_permission(self, request: Request, view: View) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CLIENT')
