Volunteer Management System
Overview
The Volunteer Management System is a software application designed to help non-profit organizations efficiently manage and optimize their volunteer activities. This application matches volunteers to various events and tasks based on their skills, preferences, location, and availability. The system also includes functionalities for event management, notification sending, and volunteer history tracking.

Features
Login System: Allows volunteers and administrators to register and log in.
User Registration: Supports basic registration with username and password, followed by email verification.
User Profile Management: Enables users to complete their profiles with location, skills, preferences, and availability.
Event Management: Allows administrators to create and manage events with specified skills, location, and urgency.
Volunteer Matching: Matches volunteers to events/tasks based on their profiles and event requirements.
Notification System: Sends notifications to volunteers regarding event assignments, updates, and reminders.
Volunteer History: Tracks and displays volunteer participation history and performance.
Installation
Prerequisites
Node.js
npm (Node Package Manager)
MySQL or PostgreSQL
Setup
Clone the repository:

bash
Copy code
git clone https://github.com/your-username/volunteer-management-system.git
cd volunteer-management-system
Install dependencies:

bash
Copy code
npm install
Set up the database:

Create a new database in MySQL or PostgreSQL.
Update the database configuration in config/db.js.
Run the application:

bash
Copy code
npm start
Usage
Register an account:

Go to the registration page and create a new account.
Verify your email to complete the registration process.
Complete your profile:

Log in and navigate to the profile page.
Fill in your location, skills, preferences, and availability.
Create and manage events:

Administrators can create new events specifying required skills, location, and urgency.
Manage existing events from the event management page.
Volunteer matching:

The system will automatically match volunteers to events based on their profiles and event requirements.
Volunteers will receive notifications about their assignments.
Track volunteer history:

View the participation history and performance metrics on the history page.
