# Generated by Django 5.1.7 on 2025-04-16 15:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_education'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkExperience',
            fields=[
                ('wid', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(db_column='uid', on_delete=django.db.models.deletion.CASCADE, related_name='work_experiences', to='api.user', to_field='uid')),
            ],
            options={
                'verbose_name': 'Work Experience',
                'verbose_name_plural': 'Work Experiences',
                'db_table': 'work_experience',
                'ordering': ['-created_at'],
            },
        ),
    ]
