from django.contrib import admin

from services.onos.models import *
from django import forms
from django.utils.safestring import mark_safe
from django.contrib.auth.admin import UserAdmin
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth.signals import user_logged_in
from django.utils import timezone
from django.contrib.contenttypes import generic
from suit.widgets import LinkedSelect
from core.admin import ServiceAppAdmin,SliceInline,ServiceAttrAsTabInline, ReadOnlyAwareAdmin, XOSTabularInline, ServicePrivilegeInline, TenantRootTenantInline, TenantRootPrivilegeInline, TenantAttrAsTabInline
from core.middleware import get_request

from functools import update_wrapper
from django.contrib.admin.views.main import ChangeList
from django.core.urlresolvers import reverse
from django.contrib.admin.utils import quote

class ONOSServiceAdmin(ReadOnlyAwareAdmin):
    model = ONOSService
    verbose_name = "ONOS Service"
    verbose_name_plural = "ONOS Services"
    list_display = ("backend_status_icon", "name", "enabled")
    list_display_links = ('backend_status_icon', 'name', )
    fieldsets = [(None, {'fields': ['backend_status_text', 'name','enabled','versionNumber', 'description',"view_url","icon_url" ], 'classes':['suit-tab suit-tab-general']})]
    readonly_fields = ('backend_status_text', )
    inlines = [SliceInline,ServiceAttrAsTabInline,ServicePrivilegeInline]

    extracontext_registered_admins = True

    user_readonly_fields = ["name", "enabled", "versionNumber", "description"]

    suit_form_tabs =(('general', 'ONOS Service Details'),
        ('administration', 'Administration'),
        ('slices','Slices'),
        ('serviceattrs','Additional Attributes'),
        ('serviceprivileges','Privileges'),
    )

    suit_form_includes = (('onosadmin.html', 'top', 'administration'),
                           )

    def queryset(self, request):
        return ONOSService.get_service_objects_by_user(request.user)

class ONOSAppForm(forms.ModelForm):
    creator = forms.ModelChoiceField(queryset=User.objects.all())
    name = forms.CharField()

    def __init__(self,*args,**kwargs):
        super (ONOSAppForm,self ).__init__(*args,**kwargs)
        self.fields['kind'].widget.attrs['readonly'] = True
        self.fields['provider_service'].queryset = ONOSService.get_service_objects().all()
        if self.instance:
            # fields for the attributes
            self.fields['creator'].initial = self.instance.creator
            self.fields['name'].initial = self.instance.name
        if (not self.instance) or (not self.instance.pk):
            # default fields for an 'add' form
            self.fields['kind'].initial = ONOS_KIND
            self.fields['creator'].initial = get_request().user
            if ONOSService.get_service_objects().exists():
               self.fields["provider_service"].initial = ONOSService.get_service_objects().all()[0]


    def save(self, commit=True):
        self.instance.creator = self.cleaned_data.get("creator")
        self.instance.name = self.cleaned_data.get("name")
        return super(ONOSAppForm, self).save(commit=commit)

    class Meta:
        model = ONOSApp

class ONOSAppAdmin(ReadOnlyAwareAdmin):
    list_display = ('backend_status_icon', 'name', )
    list_display_links = ('backend_status_icon', 'name')
    fieldsets = [ (None, {'fields': ['backend_status_text', 'kind', 'name', 'provider_service', 'service_specific_attribute',
                                     'creator'],
                          'classes':['suit-tab suit-tab-general']})]
    readonly_fields = ('backend_status_text', 'instance', 'service_specific_attribute')
    inlines = [TenantAttrAsTabInline]
    form = ONOSAppForm

    suit_form_tabs = (('general','Details'), ('tenantattrs', 'Attributes'))

    def queryset(self, request):
        return ONOSApp.get_tenant_objects_by_user(request.user)

admin.site.register(ONOSService, ONOSServiceAdmin)
admin.site.register(ONOSApp, ONOSAppAdmin)

