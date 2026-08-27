from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File as FastAPIFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from io import BytesIO

from database.session import get_db
from controllers.file_controller import FileController
from services.file_service import FileService
from schemas.file_schema import FileUpdate

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    uploader_id: UUID = Form(...),
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db)
):
    # Allowed formats validation check (PDF, DOCX, XLSX, PNG, JPG)
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

    # Read file contents and calculate size
    contents = await file.read()
    file_size = len(contents)

    # Reset file stream for upload
    file_stream = BytesIO(contents)

    # Upload file to Cloudflare R2 storage and get the file URL
    try:
        file_url = await FileService.upload_file_to_r2(file_stream, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save file record in database via controller
    result = await FileController.upload_file(db, uploader_id, file.filename, file_url, file_size, file.content_type)
    return result

@router.get("/{file_id}")
async def get_file(file_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await FileController.get_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.get("/{file_id}/download")
async def download_file(file_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await FileController.get_file(db, file_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    # Return the storage URL or direct stream for download
    return {
        "success": True, 
        "message": "Download link generated successfully", 
        "data": {"file_url": result["data"].file_url}
    }

@router.put("/{file_id}")
async def update_file(file_id: UUID, file_data: FileUpdate, db: AsyncSession = Depends(get_db)):
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