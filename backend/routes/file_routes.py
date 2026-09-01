from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File as FastAPIFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from io import BytesIO
from typing import Optional

from database.session import get_db
from controllers.file_controller import FileController
from services.file_service import FileService
from schemas.file_schema import FileUpdate
from models.file import File
from models.user import User

router = APIRouter(prefix="/api/files", tags=["Files"])

# 1. Get all files list endpoint
@router.get("", status_code=status.HTTP_200_OK)
async def get_all_files(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all uploaded files from the database.
    """
    try:
        result = await db.execute(select(File))
        files = result.scalars().all()
        return {
            "success": True,
            "message": "Files fetched successfully",
            "data": files
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    uploader_id: Optional[UUID] = Form(None),
    folder_id: Optional[UUID] = Form(None),
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file with format and 25MB size validations, storing it in Cloudflare R2.
    """
    allowed_types = [
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        "image/png", 
        "image/jpeg"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Supported formats: PDF, DOCX, XLSX, PNG, JPG"
        )

    contents = await file.read()
    file_size = len(contents)
    
    # Enforce 25MB file size validation limit
    MAX_FILE_SIZE = 25 * 1024 * 1024
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 25MB limit[cite: 9]."
        )

    # Fallback default uploader UUID lookup if not passed explicitly, preventing Foreign Key violations
    if not uploader_id:
        first_user = await db.execute(select(User).limit(1))
        user_obj = first_user.scalars().first()
        if user_obj:
            uploader_id = user_obj.id
        else:
            raise HTTPException(status_code=400, detail="No valid uploader found in database. Please log in again.")

    file_stream = BytesIO(contents)

    # Upload file to Cloudflare R2 storage securely
    try:
        file_url = await FileService.upload_file_to_r2(file_stream, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"R2 Upload Failed: {str(e)}")

    # Save file record in database via controller
    result = await FileController.upload_file(db, uploader_id, file.filename, file_url, file_size, file.content_type)
    return result

@router.get("/{file_id}")
async def get_file(file_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await FileController.get_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.get("/{file_id}/metadata", status_code=status.HTTP_200_OK)
async def get_file_metadata(file_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieve comprehensive file metadata including attributes and timestamps.
    """
    result = await FileController.get_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    file_obj = result["data"]
    return {
        "success": True,
        "message": "File metadata retrieved successfully",
        "data": {
            "id": file_obj.id,
            "file_name": file_obj.file_name,
            "file_size": file_obj.file_size,
            "file_type": file_obj.file_type,
            "file_url": file_obj.file_url,
            "uploader_id": file_obj.uploader_id,
            "created_at": file_obj.created_at,
            "updated_at": file_obj.updated_at
        }
    }

@router.get("/{file_id}/download")
async def download_file(file_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await FileController.get_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    file_obj = result["data"]
    try:
        # Pass file_url so the service can extract the permanent unique storage key
        presigned_url = await FileService.get_presigned_download_url(file_obj.file_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) # Yahan theek kar diya gaya hai

    return {
        "success": True, 
        "message": "Download link generated successfully", 
        "data": {"file_url": presigned_url}
    }

@router.put("/{file_id}")
async def update_file(file_id: UUID, file_data: FileUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update file details such as renaming or moving to another folder.
    """
    result = await FileController.update_file(db, file_id, file_data)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
async def delete_file(file_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await FileController.delete_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result