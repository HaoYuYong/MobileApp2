import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
from .models import User, JobPosition, AboutMe, Education, WorkExperience, Skills, JobScope, Favourite
from django.views.decorators.http import require_http_methods
import sqlite3
from django.db import connection
from django.db import IntegrityError
# from django.core.exceptions import ObjectDoesNotExist
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            # Parse JSON data
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['name', 'email', 'password', 'dob', 'phone', 
                             'address', 'security_question', 'security_answer', 'role']
            if not all(field in data for field in required_fields):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            # Check if email already exists
            conn = sqlite3.connect('db.sqlite3')
            cursor = conn.cursor()
            cursor.execute("SELECT email FROM api_user WHERE email = ?", (data['email'],))
            if cursor.fetchone():
                conn.close()
                return JsonResponse({'error': 'Email already exists'}, status=400)
            conn.close()
            
            # Create user
            try:
                uid = User.create_user(data)
                return JsonResponse({
                    'status': 'success',
                    'uid': uid,
                    'message': 'User registered successfully'
                }, status=201)
            except ValueError as e:
                return JsonResponse({'error': str(e)}, status=400)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            if 'email' not in data or 'password' not in data:
                return JsonResponse({'error': 'Email and password are required'}, status=400)
            
            # Find user by email
            try:
                user = User.objects.get(email=data['email'])
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid email or password'}, status=401)
            
            # Check password
            if not check_password(data['password'], user.password):
                return JsonResponse({'error': 'Invalid email or password'}, status=401)
            
            # Create session
            request.session['user_id'] = user.uid
            request.session['user_role'] = user.role
            request.session['authenticated'] = True
            
            # Return user data (excluding sensitive fields)
            return JsonResponse({
                'status': 'success',
                'user': {
                    'uid': user.uid,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'phone': user.phone
                }
            }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
        

def get_profile(request):
    if request.method == 'GET':
        uid = request.GET.get('uid')
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT name, email, dob, phone, address, role FROM api_user WHERE uid = %s", [uid])
                row = cursor.fetchone()
                
                if row:
                    profile_data = {
                        'name': row[0],
                        'email': row[1],
                        'dob': row[2],
                        'phone': row[3],
                        'address': row[4],
                        'role': row[5]
                    }
                    return JsonResponse(profile_data)
                else:
                    return JsonResponse({'error': 'User not found'}, status=404)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)



@csrf_exempt
@require_http_methods(["GET"])
def get_job_positions(request):
    uid = request.GET.get('uid')
    if not uid:
        return JsonResponse({'error': 'UID is required'}, status=400)
    
    try:
        positions = JobPosition.objects.filter(user__uid=uid).values('id', 'position', 'created_at')
        return JsonResponse(list(positions), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def create_job_position(request):
    try:
        data = json.loads(request.body)
        uid = data.get('user')
        position = data.get('position')
        
        if not uid or not position:
            return JsonResponse(
                {'error': 'User UID and position are required'}, 
                status=400
            )
            
        try:
            user = User.objects.get(uid=uid)
            
            # Check if position already exists for this user
            if JobPosition.objects.filter(user=user, position=position).exists():
                return JsonResponse(
                    {'error': 'This position already exists for the user'},
                    status=400
                )
                
            job_position = JobPosition.objects.create(user=user, position=position)
            
            return JsonResponse({
                'id': job_position.id,
                'position': job_position.position,
                'created_at': job_position.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }, status=201)
            
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except IntegrityError:
            return JsonResponse(
                {'error': 'Database error - position may already exist'},
                status=400
            )
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse(
            {'error': f'Server error: {str(e)}'},
            status=500
        )

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_job_position(request, position_id):
    try:
        position = JobPosition.objects.get(id=position_id)
        position.delete()
        return JsonResponse({'success': True}, status=200)
    except JobPosition.DoesNotExist:
        return JsonResponse({'error': 'Position not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    


@csrf_exempt
@require_http_methods(["GET"])
def get_about_me(request):
    uid = request.GET.get('uid')
    if not uid:
        return JsonResponse({'error': 'UID is required'}, status=400)
    
    try:
        about_me = AboutMe.objects.filter(uid=uid).first()
        if about_me:
            return JsonResponse({
                'aid': about_me.aid,
                'uid': about_me.uid,
                'about': about_me.about,
                'created_at': about_me.created_at,
                'updated_at': about_me.updated_at
            })
        return JsonResponse({'about': ''})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def save_about_me(request):
    try:
        data = json.loads(request.body)
        uid = data.get('uid')
        about = data.get('about', '')
        
        if not uid:
            return JsonResponse({'error': 'UID is required'}, status=400)
        
        # Create or update
        about_me, created = AboutMe.objects.update_or_create(
            uid=uid,
            defaults={'about': about}
        )
        
        return JsonResponse({
            'aid': about_me.aid,
            'uid': about_me.uid,
            'about': about_me.about,
            'created_at': about_me.created_at,
            'updated_at': about_me.updated_at
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
@require_http_methods(["GET", "POST"])
def about_me_handler(request):
    if request.method == 'GET':
        return get_about_me(request)
    elif request.method == 'POST':
        return save_about_me(request)

# Education Views
@csrf_exempt
@require_http_methods(["GET"])
def get_educations(request, uid):
    try:
        educations = Education.objects.filter(user__uid=uid).order_by('-created_at')
        data = [{
            'eid': education.eid,
            'school': education.school,
            'degree': education.degree,
            'field_of_study': education.field_of_study,
            'description': education.description,
            'created_at': education.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': education.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } for education in educations]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def add_education(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['uid', 'school', 'degree', 'field_of_study']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check if user exists
        try:
            user = User.objects.get(uid=data['uid'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Create education record
        education = Education.objects.create(
            user=user,
            school=data['school'],
            degree=data['degree'],
            field_of_study=data['field_of_study'],
            description=data.get('description', '')
        )
        
        return JsonResponse({
            'eid': education.eid,
            'message': 'Education added successfully',
            'education': {
                'eid': education.eid,
                'school': education.school,
                'degree': education.degree,
                'field_of_study': education.field_of_study,
                'description': education.description,
                'created_at': education.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': education.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_education(request, eid):
    try:
        data = json.loads(request.body)
        
        try:
            education = Education.objects.get(eid=eid)
        except Education.DoesNotExist:
            return JsonResponse({'error': 'Education not found'}, status=404)
        
        # Update fields if they exist in the request
        if 'school' in data:
            education.school = data['school']
        if 'degree' in data:
            education.degree = data['degree']
        if 'field_of_study' in data:
            education.field_of_study = data['field_of_study']
        if 'description' in data:
            education.description = data['description']
        
        education.save()
        
        return JsonResponse({
            'message': 'Education updated successfully',
            'education': {
                'eid': education.eid,
                'school': education.school,
                'degree': education.degree,
                'field_of_study': education.field_of_study,
                'description': education.description,
                'created_at': education.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': education.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_education(request, eid):
    try:
        education = Education.objects.get(eid=eid)
        education.delete()
        return JsonResponse({'message': 'Education deleted successfully'}, status=200)
    except Education.DoesNotExist:
        return JsonResponse({'error': 'Education not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def education_handler(request, uid=None, eid=None):
    if request.method == 'GET' and uid:
        return get_educations(request, uid)
    elif request.method == 'POST':
        return add_education(request)
    elif request.method == 'PUT' and eid:
        return update_education(request, eid)
    elif request.method == 'DELETE' and eid:
        return delete_education(request, eid)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

# Work Experience Views
@csrf_exempt
@require_http_methods(["GET"])
def get_work_experiences(request, uid):
    try:
        experiences = WorkExperience.objects.filter(user__uid=uid).order_by('-created_at')
        data = [{
            'wid': experience.wid,
            'title': experience.title,
            'description': experience.description,
            'created_at': experience.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': experience.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } for experience in experiences]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def add_work_experience(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['uid', 'title']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check if user exists
        try:
            user = User.objects.get(uid=data['uid'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Create work experience record
        experience = WorkExperience.objects.create(
            user=user,
            title=data['title'],
            description=data.get('description', '')
        )
        
        return JsonResponse({
            'wid': experience.wid,
            'message': 'Work experience added successfully',
            'experience': {
                'wid': experience.wid,
                'title': experience.title,
                'description': experience.description,
                'created_at': experience.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': experience.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_work_experience(request, wid):
    try:
        data = json.loads(request.body)
        
        try:
            experience = WorkExperience.objects.get(wid=wid)
        except WorkExperience.DoesNotExist:
            return JsonResponse({'error': 'Work experience not found'}, status=404)
        
        # Update fields if they exist in the request
        if 'title' in data:
            experience.title = data['title']
        if 'description' in data:
            experience.description = data['description']
        
        experience.save()
        
        return JsonResponse({
            'message': 'Work experience updated successfully',
            'experience': {
                'wid': experience.wid,
                'title': experience.title,
                'description': experience.description,
                'created_at': experience.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': experience.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_work_experience(request, wid):
    try:
        experience = WorkExperience.objects.get(wid=wid)
        experience.delete()
        return JsonResponse({'message': 'Work experience deleted successfully'}, status=200)
    except WorkExperience.DoesNotExist:
        return JsonResponse({'error': 'Work experience not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def work_experience_handler(request, uid=None, wid=None):
    if request.method == 'GET' and uid:
        return get_work_experiences(request, uid)
    elif request.method == 'POST':
        return add_work_experience(request)
    elif request.method == 'PUT' and wid:
        return update_work_experience(request, wid)
    elif request.method == 'DELETE' and wid:
        return delete_work_experience(request, wid)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

# Skills Views
@csrf_exempt
@require_http_methods(["GET"])
def get_skills(request, uid):
    try:
        skills = Skills.objects.filter(user__uid=uid).order_by('-created_at')
        data = [{
            'sid': skill.sid,
            'skill': skill.skill,
            'created_at': skill.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': skill.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } for skill in skills]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def add_skill(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['uid', 'skill']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check if user exists
        try:
            user = User.objects.get(uid=data['uid'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Create skill record
        skill = Skills.objects.create(
            user=user,
            skill=data['skill']
        )
        
        return JsonResponse({
            'sid': skill.sid,
            'message': 'Skill added successfully',
            'skill': {
                'sid': skill.sid,
                'skill': skill.skill,
                'created_at': skill.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': skill.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_skill(request, sid):
    try:
        data = json.loads(request.body)
        
        try:
            skill = Skills.objects.get(sid=sid)
        except Skills.DoesNotExist:
            return JsonResponse({'error': 'Skill not found'}, status=404)
        
        # Update fields if they exist in the request
        if 'skill' in data:
            skill.skill = data['skill']
        
        skill.save()
        
        return JsonResponse({
            'message': 'Skill updated successfully',
            'skill': {
                'sid': skill.sid,
                'skill': skill.skill,
                'created_at': skill.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': skill.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_skill(request, sid):
    try:
        skill = Skills.objects.get(sid=sid)
        skill.delete()
        return JsonResponse({'message': 'Skill deleted successfully'}, status=200)
    except Skills.DoesNotExist:
        return JsonResponse({'error': 'Skill not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def skills_handler(request, uid=None, sid=None):
    if request.method == 'GET' and uid:
        return get_skills(request, uid)
    elif request.method == 'POST':
        return add_skill(request)
    elif request.method == 'PUT' and sid:
        return update_skill(request, sid)
    elif request.method == 'DELETE' and sid:
        return delete_skill(request, sid)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
@csrf_exempt
@require_http_methods(["GET"])
def get_job_scope(request):
    uid = request.GET.get('uid')
    if not uid:
        return JsonResponse({'error': 'UID is required'}, status=400)
    
    try:
        job_scope = JobScope.objects.filter(uid=uid).first()
        if job_scope:
            return JsonResponse({
                'jid': job_scope.jid,
                'uid': job_scope.uid,
                'scope': job_scope.scope,
                'created_at': job_scope.created_at,
                'updated_at': job_scope.updated_at
            })
        return JsonResponse({'scope': ''})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def save_job_scope(request):
    try:
        data = json.loads(request.body)
        uid = data.get('uid')
        scope = data.get('scope', '')
        
        if not uid:
            return JsonResponse({'error': 'UID is required'}, status=400)
        
        # Create or update
        job_scope, created = JobScope.objects.update_or_create(
            uid=uid,
            defaults={'scope': scope}
        )
        
        return JsonResponse({
            'jid': job_scope.jid,
            'uid': job_scope.uid,
            'scope': job_scope.scope,
            'created_at': job_scope.created_at,
            'updated_at': job_scope.updated_at
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def job_scope_handler(request):
    if request.method == 'GET':
        return get_job_scope(request)
    elif request.method == 'POST':
        return save_job_scope(request)
    
# To fetch companies with open position and job scopes
@csrf_exempt
@require_http_methods(["GET"])
def get_companies_with_positions_and_scopes(request):
    try:
        companies = User.objects.filter(role='company').values('uid', 'name', 'email', 'phone')
        
        company_data = []
        for company in companies:
            positions = JobPosition.objects.filter(user__uid=company['uid']).values('id', 'position')
            job_scope = JobScope.objects.filter(uid=company['uid']).first()
            about_info = AboutMe.objects.filter(uid=company['uid']).first()
            
            # Preserve newlines by replacing them with HTML line breaks
            scope = job_scope.scope if job_scope else ''
            scope = scope.replace('\n', '<br>') if scope else ''

            # Get about info
            about = about_info.about if about_info else ''
            about = about.replace('\n', '<br>') if about else ''
            
            company_data.append({
                'uid': company['uid'],
                'name': company['name'],
                'email': company['email'],
                'phone': company['phone'],
                'positions': list(positions),
                'scope': scope,
                'about': about
            })
            
        return JsonResponse(company_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# Favourite
@csrf_exempt
@require_http_methods(["POST"])
def toggle_favourite(request):
    try:
        data = json.loads(request.body)
        user_uid = data.get('user_uid')
        company_uid = data.get('company_uid')
        
        if not user_uid or not company_uid:
            return JsonResponse({'error': 'Both user_uid and company_uid are required'}, status=400)
        
        try:
            user = User.objects.get(uid=user_uid)
            company = User.objects.get(uid=company_uid, role='company')
            
            # Check if favourite exists
            favourite, created = Favourite.objects.get_or_create(
                user=user,
                company=company
            )
            
            if not created:
                favourite.delete()
                return JsonResponse({'status': 'removed', 'message': 'Company removed from favourites'})
            
            return JsonResponse({'status': 'added', 'message': 'Company added to favourites'})
            
        except User.DoesNotExist:
            return JsonResponse({'error': 'User or Company not found'}, status=404)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_favourites(request):
    user_uid = request.GET.get('user_uid')
    if not user_uid:
        return JsonResponse({'error': 'user_uid is required'}, status=400)
    
    try:
        favourites = Favourite.objects.filter(user__uid=user_uid).select_related('company')
        
        favourite_companies = []
        for fav in favourites:
            company = fav.company
            positions = JobPosition.objects.filter(user=company).values('id', 'position')
            job_scope = JobScope.objects.filter(uid=company.uid).first()
            about_info = AboutMe.objects.filter(uid=company.uid).first()
            
            scope = job_scope.scope if job_scope else ''
            scope = scope.replace('\n', '<br>') if scope else ''

            about = about_info.about if about_info else ''
            about = about.replace('\n', '<br>') if about else ''
            
            favourite_companies.append({
                'uid': company.uid,
                'name': company.name,
                'email': company.email,
                'phone': company.phone,
                'positions': list(positions),
                'scope': scope,
                'about': about
            })
            
        return JsonResponse(favourite_companies, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)