from django.contrib import admin
from django.urls import path
from api.views import register,login
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('api/get_profile/', views.get_profile, name='get_profile'),
    path('api/job-positions/', views.create_job_position, name='create-job-position'),
    path('api/job-positions/list/', views.get_job_positions, name='get-job-positions'),
    path('api/job-positions/delete/<int:position_id>/', views.delete_job_position, name='delete-job-position'),
    path('api/about-me/', views.about_me_handler, name='about_me'),
    path('api/educations/add/', views.add_education, name='add_education'),
    path('api/educations/update/<int:eid>/', views.update_education, name='update_education'),
    path('api/educations/delete/<int:eid>/', views.delete_education, name='delete_education'),
    path('api/educations/user/<str:uid>/', views.get_educations, name='get_educations'),
    path('api/work-experiences/add/', views.add_work_experience, name='add_work_experience'),
    path('api/work-experiences/update/<int:wid>/', views.update_work_experience, name='update_work_experience'),
    path('api/work-experiences/delete/<int:wid>/', views.delete_work_experience, name='delete_work_experience'),
    path('api/work-experiences/user/<str:uid>/', views.get_work_experiences, name='get_work_experiences'),
    path('api/skills/add/', views.add_skill, name='add_skill'),
    path('api/skills/update/<int:sid>/', views.update_skill, name='update_skill'),
    path('api/skills/delete/<int:sid>/', views.delete_skill, name='delete_skill'),
    path('api/skills/user/<str:uid>/', views.get_skills, name='get_skills'),
    path('api/job-scope/', views.job_scope_handler, name='job_scope'),
    path('api/companies/', views.get_companies_with_positions_and_scopes, name='get-companies'),
    path('api/favourites/toggle/', views.toggle_favourite, name='toggle-favourite'),
    path('api/favourites/', views.get_favourites, name='get-favourites'),
]   