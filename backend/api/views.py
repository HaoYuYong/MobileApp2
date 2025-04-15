import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
from .models import User, JobPosition
from django.views.decorators.http import require_http_methods
import sqlite3
from django.db import connection
from django.db import IntegrityError

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