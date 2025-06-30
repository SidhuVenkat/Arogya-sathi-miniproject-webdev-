import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, session
from datetime import datetime, timedelta
from data_manager import DataManager
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "rural-health-assistant-secret-key")

# Add custom filter for newline to break conversion
@app.template_filter('nl2br')
def nl2br_filter(text):
    """Convert newlines to HTML line breaks"""
    from markupsafe import Markup
    if not text:
        return text
    return Markup(text.replace('\n', '<br>\n'))

# Initialize data manager
data_manager = DataManager()

def send_email(to_email, subject, message):
    """Send email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(message, 'plain'))
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, to_email, text)
        server.quit()
        
        logging.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logging.error(f"Error sending email to {to_email}: {e}")
        return False

@app.route('/')
def index():
    """Dashboard with overview of patients, appointments, and quick actions"""
    try:
        # Get summary statistics
        total_patients = len(data_manager.get_patients())
        today_appointments = data_manager.get_appointments_by_date(datetime.now().strftime('%Y-%m-%d'))
        recent_patients = data_manager.get_patients()[-5:] if data_manager.get_patients() else []
        
        return render_template('index.html', 
                             total_patients=total_patients,
                             today_appointments=len(today_appointments),
                             recent_patients=recent_patients)
    except Exception as e:
        logging.error(f"Error loading dashboard: {e}")
        flash('Error loading dashboard data', 'error')
        return render_template('index.html', 
                             total_patients=0,
                             today_appointments=0,
                             recent_patients=[])

@app.route('/patients')
def patients():
    """List all patients with search functionality"""
    search_query = request.args.get('search', '').strip()
    try:
        all_patients = data_manager.get_patients()
        
        if search_query:
            # Filter patients by name, phone, email, or ID
            filtered_patients = []
            for patient in all_patients:
                if (search_query.lower() in patient.get('name', '').lower() or
                    search_query in patient.get('phone', '') or
                    search_query.lower() in patient.get('email', '').lower() or
                    search_query in patient.get('patient_id', '')):
                    filtered_patients.append(patient)
            all_patients = filtered_patients
            
        return render_template('patients.html', patients=all_patients, search_query=search_query)
    except Exception as e:
        logging.error(f"Error loading patients: {e}")
        flash('Error loading patient data', 'error')
        return render_template('patients.html', patients=[], search_query=search_query)

@app.route('/patient/new', methods=['GET', 'POST'])
def new_patient():
    """Register a new patient"""
    if request.method == 'POST':
        try:
            patient_data = {
                'patient_id': request.form['patient_id'],
                'name': request.form['name'],
                'age': request.form['age'],
                'gender': request.form['gender'],
                'phone': request.form['phone'],
                'email': request.form['email'],
                'address': request.form['address'],
                'emergency_contact': request.form['emergency_contact'],
                'medical_conditions': request.form['medical_conditions'],
                'medications': request.form['medications'],
                'blood_group': request.form['blood_group'],
                'registration_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            if data_manager.add_patient(patient_data):
                flash('Patient registered successfully!', 'success')
                return redirect(url_for('patients'))
            else:
                flash('Error: Patient ID already exists', 'error')
        except Exception as e:
            logging.error(f"Error adding patient: {e}")
            flash('Error registering patient', 'error')
    
    return render_template('patient_form.html')

@app.route('/patient/<patient_id>')
def patient_detail(patient_id):
    """View patient details and medical history"""
    try:
        patient = data_manager.get_patient_by_id(patient_id)
        if not patient:
            flash('Patient not found', 'error')
            return redirect(url_for('patients'))
        
        # Get patient's appointments
        appointments = data_manager.get_appointments_by_patient(patient_id)
        
        return render_template('patient_detail.html', patient=patient, appointments=appointments)
    except Exception as e:
        logging.error(f"Error loading patient details: {e}")
        flash('Error loading patient details', 'error')
        return redirect(url_for('patients'))

@app.route('/patient/<patient_id>/edit', methods=['GET', 'POST'])
def edit_patient(patient_id):
    """Edit patient information"""
    try:
        patient = data_manager.get_patient_by_id(patient_id)
        if not patient:
            flash('Patient not found', 'error')
            return redirect(url_for('patients'))
        
        if request.method == 'POST':
            updated_data = {
                'patient_id': patient_id,  # Keep original ID
                'name': request.form['name'],
                'age': request.form['age'],
                'gender': request.form['gender'],
                'phone': request.form['phone'],
                'email': request.form['email'],
                'address': request.form['address'],
                'emergency_contact': request.form['emergency_contact'],
                'medical_conditions': request.form['medical_conditions'],
                'medications': request.form['medications'],
                'blood_group': request.form['blood_group'],
                'registration_date': patient['registration_date']  # Keep original date
            }
            
            if data_manager.update_patient(patient_id, updated_data):
                flash('Patient information updated successfully!', 'success')
                return redirect(url_for('patient_detail', patient_id=patient_id))
            else:
                flash('Error updating patient information', 'error')
        
        return render_template('patient_form.html', patient=patient, edit_mode=True)
    except Exception as e:
        logging.error(f"Error editing patient: {e}")
        flash('Error loading patient for editing', 'error')
        return redirect(url_for('patients'))

@app.route('/first-aid')
def first_aid():
    """Display first aid categories and search"""
    search_query = request.args.get('search', '').strip()
    try:
        all_guides = data_manager.get_first_aid_guides()
        
        if search_query:
            # Filter guides by title or symptoms
            filtered_guides = []
            for guide in all_guides:
                if (search_query.lower() in guide.get('title', '').lower() or
                    search_query.lower() in guide.get('symptoms', '').lower() or
                    search_query.lower() in guide.get('category', '').lower()):
                    filtered_guides.append(guide)
            all_guides = filtered_guides
        
        return render_template('first_aid.html', guides=all_guides, search_query=search_query)
    except Exception as e:
        logging.error(f"Error loading first aid guides: {e}")
        flash('Error loading first aid guides', 'error')
        return render_template('first_aid.html', guides=[], search_query=search_query)

@app.route('/first-aid/<guide_id>')
def first_aid_detail(guide_id):
    """Display detailed first aid instructions"""
    try:
        guide = data_manager.get_first_aid_guide_by_id(guide_id)
        if not guide:
            flash('First aid guide not found', 'error')
            return redirect(url_for('first_aid'))
        
        return render_template('first_aid_detail.html', guide=guide)
    except Exception as e:
        logging.error(f"Error loading first aid guide: {e}")
        flash('Error loading first aid guide', 'error')
        return redirect(url_for('first_aid'))

@app.route('/emergency-contacts')
def emergency_contacts():
    """Display emergency contact directory"""
    try:
        contacts = data_manager.get_emergency_contacts()
        return render_template('emergency_contacts.html', contacts=contacts)
    except Exception as e:
        logging.error(f"Error loading emergency contacts: {e}")
        flash('Error loading emergency contacts', 'error')
        return render_template('emergency_contacts.html', contacts=[])

@app.route('/appointments')
def appointments():
    """Display and manage appointments"""
    date_filter = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    try:
        appointments = data_manager.get_appointments_by_date(date_filter)
        
        # Calculate previous and next dates
        current_date = datetime.strptime(date_filter, '%Y-%m-%d')
        previous_date = (current_date - timedelta(days=1)).strftime('%Y-%m-%d')
        next_date = (current_date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        return render_template('appointments.html', 
                             appointments=appointments, 
                             selected_date=date_filter,
                             previous_date=previous_date,
                             next_date=next_date)
    except Exception as e:
        logging.error(f"Error loading appointments: {e}")
        flash('Error loading appointments', 'error')
        return render_template('appointments.html', 
                             appointments=[], 
                             selected_date=date_filter,
                             previous_date=date_filter,
                             next_date=date_filter)

@app.route('/appointment/add', methods=['POST'])
def add_appointment():
    """Add a new appointment"""
    try:
        appointment_data = {
            'appointment_id': f"APT{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'patient_id': request.form['patient_id'],
            'patient_name': request.form['patient_name'],
            'date': request.form['date'],
            'time': request.form['time'],
            'purpose': request.form['purpose'],
            'status': 'scheduled',
            'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        if data_manager.add_appointment(appointment_data):
            flash('Appointment scheduled successfully!', 'success')
        else:
            flash('Error scheduling appointment', 'error')
    except Exception as e:
        logging.error(f"Error adding appointment: {e}")
        flash('Error scheduling appointment', 'error')
    
    return redirect(url_for('appointments'))

@app.route('/health-education')
def health_education():
    """Display health education content"""
    try:
        content = data_manager.get_health_education_content()
        return render_template('health_education.html', content=content)
    except Exception as e:
        logging.error(f"Error loading health education content: {e}")
        flash('Error loading health education content', 'error')
        return render_template('health_education.html', content=[])

@app.route('/reminders')
def reminders():
    """List all reminders"""
    try:
        reminders = data_manager.get_reminders()
        patients = data_manager.get_patients()
        return render_template('reminders.html', reminders=reminders, patients=patients)
    except Exception as e:
        logging.error(f"Error loading reminders: {e}")
        flash('Error loading reminders', 'error')
        return render_template('reminders.html', reminders=[], patients=[])

@app.route('/reminder/add', methods=['GET', 'POST'])
def add_reminder():
    """Add a new reminder and send email instantly"""
    patients = data_manager.get_patients()
    if request.method == 'POST':
        try:
            patient_id = request.form['patient_id']
            patient = data_manager.get_patient_by_id(patient_id)
            if not patient:
                flash('Patient not found', 'error')
                return redirect(url_for('add_reminder'))
            
            reminder_id = f"REM{datetime.now().strftime('%Y%m%d%H%M%S')}"
            message = request.form['message']
            scheduled_time = request.form['scheduled_time']
            
            # Create professional email content
            subject = "Appointment Reminder - Rural Health Assistant"
            email_body = f"""
Dear {patient['name']},

This is a reminder for your upcoming appointment.

Message: {message}

Scheduled Time: {scheduled_time}

Please ensure you arrive on time for your appointment.

Best regards,
Rural Health Assistant Team
            """
            
            # Send email instantly
            email_sent = send_email(patient['email'], subject, email_body.strip())
            
            reminder_data = {
                'reminder_id': reminder_id,
                'patient_id': patient_id,
                'patient_name': patient['name'],
                'email': patient['email'],
                'message': message,
                'scheduled_time': scheduled_time,
                'status': 'sent' if email_sent else 'failed',
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            data_manager.add_reminder(reminder_data)
            
            if email_sent:
                flash('Reminder added and email sent successfully!', 'success')
            else:
                flash('Reminder added but email failed to send.', 'warning')
            
            return redirect(url_for('reminders'))
        except Exception as e:
            logging.error(f"Error adding reminder: {e}")
            flash('Error adding reminder', 'error')
            return redirect(url_for('add_reminder'))
    return render_template('add_reminder.html', patients=patients)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
