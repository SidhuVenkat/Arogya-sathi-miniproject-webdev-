# Email Reminders Setup Guide

This guide will help you set up instant email reminders for your Rural Health Assistant application using Gmail SMTP.

## Prerequisites

1. A Gmail account
2. 2-Factor Authentication enabled on your Gmail account
3. Python 3.7+ installed

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the steps to enable 2-Factor Authentication

## Step 2: Generate an App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Scroll down and click on "App passwords"
5. Select "Mail" from the dropdown
6. Click "Generate"
7. Copy the 16-character password that appears

## Step 3: Configure Email Settings

1. Open the `config.py` file in your project
2. Replace the placeholder values with your actual Gmail credentials:

```python
SMTP_USERNAME = 'your_actual_email@gmail.com'  # Your Gmail address
SMTP_PASSWORD = 'your_16_char_app_password'    # The app password you generated
SENDER_EMAIL = 'your_actual_email@gmail.com'   # Your Gmail address
```

## Step 4: Test the Setup

1. Start your Flask application:
   ```bash
   python app.py
   ```

2. Register a new patient with a valid email address
3. Go to the Reminders section and click "Send Email Reminder"
4. Fill in the form and submit - the email will be sent immediately

## Features

- **Instant Email Reminders**: Emails are sent immediately when you create a reminder
- **Patient Registration**: Includes email field for sending reminders
- **Professional Email Format**: Well-formatted reminder emails with patient details
- **Status Tracking**: Track which reminders were sent successfully
- **Real-time Feedback**: Get immediate confirmation of email delivery status

## Email Format

The reminder emails include:
- Patient's name
- Reminder message
- Appointment date and time
- Professional formatting

## How It Works

1. **Create Reminder**: Fill out the reminder form with patient, message, and appointment time
2. **Instant Delivery**: Email is sent immediately to the patient's email address
3. **Status Update**: The reminder status shows as "Sent" or "Failed" based on delivery
4. **Confirmation**: You get immediate feedback on whether the email was sent successfully

## Troubleshooting

### Common Issues:

1. **"Authentication failed" error**
   - Make sure you're using the App Password, not your regular Gmail password
   - Ensure 2-Factor Authentication is enabled

2. **"SMTP server not found" error**
   - Check your internet connection
   - Verify the SMTP settings in `config.py`

3. **Emails not being sent**
   - Check the application logs for error messages
   - Verify the patient has a valid email address
   - Ensure your Gmail credentials are correct

### Security Notes:

- Never commit your actual Gmail credentials to version control
- Use environment variables for production deployments
- The App Password is more secure than using your regular password

## Support

If you encounter any issues, check the application logs for detailed error messages. The system will log any errors that occur during email sending. 