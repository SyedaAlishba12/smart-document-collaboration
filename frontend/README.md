# Smart Document Collaboration Platform

A full-stack, real-time document collaboration platform inspired by applications such as Google Docs and Notion. The platform allows users to create, organize, edit, share, comment on, search, and collaborate on documents within workspaces.

The system provides role-based document sharing, real-time collaboration through WebSockets, comments and replies, version history, notifications, search, workspace management, and file management.

---

##  Project Overview

The **Smart Document Collaboration Platform** is designed to provide a centralized environment where users and teams can create and manage documents while collaborating in real time.

The platform supports:

* User authentication and session management
* Workspace and team management
* Document and folder management
* Rich-text document editing
* Real-time collaborative editing
* Active-user presence
* Cursor/presence updates
* Comments and replies
* Document version history
* Document sharing and permissions
* Search functionality
* Notifications
* File management
* Dashboard and recent activity
* Role-based access control

---

##  Features

###  Authentication & User Management

* User registration and login
* Session management
* Logout
* Email verification
* Password recovery
* User profiles
* Role-based access control

###  Workspace Management

* Create and manage workspaces
* Workspace members
* Workspace roles
* Team management
* Add and remove team members
* Workspace-based document organization

###  Document & Folder Management

* Create documents
* Edit documents
* Delete documents
* Rename documents
* Organize documents into folders
* Navigate between folders
* Recent documents
* Shared documents
* Favorite documents

###  Rich Text Editor

The document editor supports:

* Headings
* Paragraphs
* Bold
* Italic
* Underline
* Lists
* Links
* Images
* Tables
* Code blocks
* Blockquotes
* File attachments
* Automatic saving

###  Real-Time Collaboration

Real-time collaboration is implemented using **WebSockets**.

The platform supports:

* Multiple users working on the same document
* Active-user presence
* Online/offline status
* Real-time document updates
* Cursor position updates
* Collaboration status
* Permission-based editing access

###  Comments

Users can:

* Add comments
* Reply to comments
* View comment authors
* Resolve comments
* Delete comments
* Collaborate through document discussions

###  Version History

The system maintains document versions and allows users to:

* View previous versions
* See version information
* Track document changes
* Identify version authors
* Restore previous document versions

###  Sharing & Permissions

Documents can be shared with different permission levels:

* **Owner**
* **Editor**
* **Commenter**
* **Viewer**

Permissions control what each user can do with a shared document.

For example:

* Editors can modify documents.
* Commenters can participate through comments.
* Viewers can access documents without editing them.

###  Search

Users can search across platform content, including:

* Documents
* Folders
* Users
* Workspace content

###  Notifications

The notification system supports notifications for events such as:

* Document sharing
* Comments
* Replies
* Mentions
* Permission changes
* Document updates

###  Dashboard

The dashboard provides access to:

* Recent documents
* My documents
* Shared with me
* Favorites
* Workspaces
* Recent activity

###  File Management

The platform supports document-related file management, including:

* Upload
* Download
* Rename
* Delete
* Organize files
* Folder-based organization

Supported file types include:

* PDF
* DOCX
* XLSX
* PNG
* JPG

---

#  Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* TipTap
* Axios
* Lucide React

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* WebSockets
* Alembic

## Database

* PostgreSQL
* SQLAlchemy ORM

## Storage

* Cloudflare R2
* boto3

## Development & Version Control

* Git
* GitHub
* npm
* Python virtual environment

---

#  Project Architecture


Smart-Document-Collaboration-Platform/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── lib/
│   │   └── utils/
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── database/
│   ├── middleware/
│   ├── utils/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── docs/
│   ├── ERD
│   ├── API Documentation
│   └── ...
│
└── README.md
```

---

#  Installation & Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Python 3.x
* PostgreSQL
* Git

---

#  Backend Setup

Navigate to the backend directory:


cd backend


Create a virtual environment:


python -m venv venv


Activate the virtual environment on Windows:


.\venv\Scripts\Activate.ps1


Install dependencies:


pip install -r requirements.txt


Create a `.env` file in the backend directory and configure the required environment variables.

Example:


DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret

R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET_NAME=your_bucket_name


Run the backend:

uvicorn main:app --reload

The backend will run at:


http://localhost:8000


---
#  Frontend Setup

Navigate to the frontend:


cd frontend


Install dependencies:


npm install


Create the required environment configuration.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Start the development server:


npm run dev


The frontend will normally be available at:

http://localhost:3000
```

---

#  API Documentation

The backend is built with FastAPI and provides automatic interactive API documentation.

Once the backend is running, open:

http://localhost:8000/docs


Swagger UI allows developers to:

* View available endpoints
* Inspect request parameters
* Test API endpoints
* View request and response schemas
* Review authentication requirements

Alternative documentation is available through:


http://localhost:8000/redoc


---
# Real-Time Collaboration API

Real-time collaboration uses WebSockets.

The collaboration endpoint follows the structure:


/ws/documents/{document_id}?token={JWT}


The system handles events including:


document:join
document:presence
document:cursor
document:update
document:save


These events allow users to receive real-time document updates and collaboration presence information.



#  Database

The application uses **PostgreSQL** as its relational database.

The database contains entities for major platform functionality, including:

* Users
* Workspaces
* Workspace members
* Teams
* Documents
* Folders
* Comments
* Comment replies
* Document versions
* Permissions
* Notifications
* Files
* Activity logs

Database models are implemented using SQLAlchemy.

Database migrations are managed using Alembic.

---

#  Security

The application includes several security mechanisms:

* JWT-based authentication
* Authorization checks
* Role-based access control
* Protected document routes
* Permission-based document access
* Viewer editing restrictions
* Environment variables for sensitive configuration
* Secure API communication
* Backend validation

Sensitive credentials such as database passwords, JWT secrets, API keys, and storage credentials should never be committed to GitHub.


#  Testing & Integration

The project was tested through frontend-backend integration and functional testing of the major modules.

Testing included:

* Authentication flows
* Workspace navigation
* Document creation and access
* Document editing
* Autosave
* Folder navigation
* Sharing and permissions
* Viewer restrictions
* Comments and replies
* Version history
* Search
* Notifications
* Real-time collaboration
* WebSocket connectivity
* API communication
* Dashboard functionality
* Team management

Integration testing was also performed after merging team members' modules into the main development branch.



#  Git Workflow

The project uses Git and GitHub for version control and team collaboration.

Main branches:

main
develop


Feature development is performed using feature branches.

Typical workflow:


git checkout develop
git pull origin develop

git checkout -b feature/your-feature

# Make changes

git add .
git commit -m "Implement feature"

git push origin feature/your-feature


Changes are reviewed and integrated into the `develop` branch before the final project release.



#  Team Members
## Syeda Alishba — Team Lead
## Fatima Khalid Siddiqui
## Zainab Bibi
## Syed Sayeel Abbas
## Taha Tanvir



**Smart Document Collaboration Platform**

Developed as a collaborative full-stack software engineering project using modern web technologies, REST APIs, PostgreSQL, and WebSocket-based real-time communication.


#  License

This project was developed for educational and academic purposes.
