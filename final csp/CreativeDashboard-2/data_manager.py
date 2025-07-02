import csv
import os
import logging
from typing import List, Dict, Optional

class DataManager:
    """Manages CSV data storage for the rural health assistant app"""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data')
        self.ensure_data_directory()
        self.initialize_csv_files()
    
    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def initialize_csv_files(self):
        """Initialize CSV files with headers if they don't exist"""
        csv_files = {
            'patients.csv': ['patient_id', 'name', 'age', 'gender', 'phone', 'email', 'address', 
                           'emergency_contact', 'medical_conditions', 'medications', 
                           'blood_group', 'registration_date'],
            'first_aid.csv': ['guide_id', 'title', 'category', 'symptoms', 'steps', 
                             'warnings', 'when_to_seek_help'],
            'emergency_contacts.csv': ['contact_id', 'name', 'designation', 'phone', 
                                     'address', 'availability', 'specialization'],
            'appointments.csv': ['appointment_id', 'patient_id', 'patient_name', 'date', 
                               'time', 'purpose', 'status', 'created_date'],
            'health_education.csv': ['content_id', 'title', 'category', 'content', 
                                   'target_audience', 'language'],
            'reminders.csv': ['reminder_id', 'patient_id', 'patient_name', 'email', 'message', 'scheduled_time', 'status', 'created_at']
        }
        
        for filename, headers in csv_files.items():
            filepath = os.path.join(self.data_dir, filename)
            if not os.path.exists(filepath):
                try:
                    with open(filepath, 'w', newline='', encoding='utf-8') as file:
                        writer = csv.writer(file)
                        writer.writerow(headers)
                    logging.info(f"Created {filename} with headers")
                except Exception as e:
                    logging.error(f"Error creating {filename}: {e}")
    
    def read_csv(self, filename: str) -> List[Dict]:
        """Read CSV file and return list of dictionaries"""
        filepath = os.path.join(self.data_dir, filename)
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                data = list(reader)
        except FileNotFoundError:
            logging.warning(f"CSV file {filename} not found")
        except Exception as e:
            logging.error(f"Error reading {filename}: {e}")
        return data
    
    def write_csv(self, filename: str, data: List[Dict], headers: List[str]):
        """Write data to CSV file"""
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=headers)
                writer.writeheader()
                writer.writerows(data)
            return True
        except Exception as e:
            logging.error(f"Error writing to {filename}: {e}")
            return False
    
    def append_csv(self, filename: str, row_data: Dict):
        """Append a single row to CSV file"""
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'a', newline='', encoding='utf-8') as file:
                if os.path.getsize(filepath) == 0:
                    # File is empty, write headers first
                    writer = csv.DictWriter(file, fieldnames=row_data.keys())
                    writer.writeheader()
                else:
                    writer = csv.DictWriter(file, fieldnames=row_data.keys())
                writer.writerow(row_data)
            return True
        except Exception as e:
            logging.error(f"Error appending to {filename}: {e}")
            return False
    
    # Patient management methods
    def get_patients(self) -> List[Dict]:
        """Get all patients"""
        return self.read_csv('patients.csv')
    
    def get_patient_by_id(self, patient_id: str) -> Optional[Dict]:
        """Get a specific patient by ID"""
        patients = self.get_patients()
        for patient in patients:
            if patient['patient_id'] == patient_id:
                return patient
        return None
    
    def add_patient(self, patient_data: Dict) -> bool:
        """Add a new patient"""
        # Check if patient ID already exists
        existing_patient = self.get_patient_by_id(patient_data['patient_id'])
        if existing_patient:
            return False
        
        return self.append_csv('patients.csv', patient_data)
    
    def update_patient(self, patient_id: str, updated_data: Dict) -> bool:
        """Update patient information"""
        patients = self.get_patients()
        headers = ['patient_id', 'name', 'age', 'gender', 'phone', 'email', 'address', 
                  'emergency_contact', 'medical_conditions', 'medications', 
                  'blood_group', 'registration_date']
        
        for i, patient in enumerate(patients):
            if patient['patient_id'] == patient_id:
                patients[i] = updated_data
                return self.write_csv('patients.csv', patients, headers)
        return False
    
    # First aid guide methods
    def get_first_aid_guides(self) -> List[Dict]:
        """Get all first aid guides"""
        return self.read_csv('first_aid.csv')
    
    def get_first_aid_guide_by_id(self, guide_id: str) -> Optional[Dict]:
        """Get a specific first aid guide by ID"""
        guides = self.get_first_aid_guides()
        for guide in guides:
            if guide['guide_id'] == guide_id:
                return guide
        return None
    
    # Emergency contacts methods
    def get_emergency_contacts(self) -> List[Dict]:
        """Get all emergency contacts"""
        return self.read_csv('emergency_contacts.csv')
    
    # Appointment methods
    def get_appointments(self) -> List[Dict]:
        """Get all appointments"""
        return self.read_csv('appointments.csv')
    
    def get_appointments_by_date(self, date: str) -> List[Dict]:
        """Get appointments for a specific date"""
        appointments = self.get_appointments()
        return [apt for apt in appointments if apt['date'] == date]
    
    def get_appointments_by_patient(self, patient_id: str) -> List[Dict]:
        """Get appointments for a specific patient"""
        appointments = self.get_appointments()
        return [apt for apt in appointments if apt['patient_id'] == patient_id]
    
    def add_appointment(self, appointment_data: Dict) -> bool:
        """Add a new appointment"""
        return self.append_csv('appointments.csv', appointment_data)
    
    # Health education methods
    def get_health_education_content(self) -> List[Dict]:
        """Get all health education content"""
        return self.read_csv('health_education.csv')

    # Reminders methods
    def get_reminders(self) -> List[Dict]:
        """Get all reminders"""
        return self.read_csv('reminders.csv')

    def add_reminder(self, reminder_data: Dict) -> bool:
        """Add a new reminder"""
        return self.append_csv('reminders.csv', reminder_data)

    def get_reminders_by_patient_id(self, patient_id: str) -> List[Dict]:
        """Get reminders for a specific patient"""
        reminders = self.get_reminders()
        return [rem for rem in reminders if rem['patient_id'] == patient_id]

    def update_reminder_status(self, reminder_id: str, new_status: str) -> bool:
        """Update the status of a reminder by its ID"""
        reminders = self.get_reminders()
        updated = False
        headers = []
        if reminders:
            headers = list(reminders[0].keys())
        for reminder in reminders:
            if reminder['reminder_id'] == reminder_id:
                reminder['status'] = new_status
                updated = True
        if updated and headers:
            return self.write_csv('reminders.csv', reminders, headers)
        return False
