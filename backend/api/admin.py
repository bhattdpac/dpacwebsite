from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Document, Clause, SmartContractTemplate, ContractProposal, ResearchPaper, ResearchObjective, Publication, Experiment, ResearchLog, Course, Resource

admin.site.register(User, UserAdmin)
admin.site.register(Document)
admin.site.register(Clause)
admin.site.register(SmartContractTemplate)
admin.site.register(ContractProposal)
admin.site.register(ResearchPaper)
admin.site.register(ResearchObjective)
admin.site.register(Publication)
admin.site.register(Experiment)
admin.site.register(ResearchLog)
admin.site.register(Course)
admin.site.register(Resource)
