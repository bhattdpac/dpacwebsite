from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Document, Clause, SmartContractTemplate, ContractProposal, ResearchPaper, ResearchObjective, Publication

admin.site.register(User, UserAdmin)
admin.site.register(Document)
admin.site.register(Clause)
admin.site.register(SmartContractTemplate)
admin.site.register(ContractProposal)
admin.site.register(ResearchPaper)
admin.site.register(ResearchObjective)
admin.site.register(Publication)
