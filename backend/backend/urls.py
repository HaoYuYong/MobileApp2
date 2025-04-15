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
]