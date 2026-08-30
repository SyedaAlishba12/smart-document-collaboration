from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from services.file_service import FileService
from schemas.file_schema import FileUpdate

class FileController:
    @staticmethod
    async def upload_file(db: AsyncSession, uploader_id: UUID, file_name: str, file_url: str, file_size: int, file_type: str):
        # Type & Size validation checks can be enforced here according to rules
        file_obj = await FileService.create_file_record(db, uploader_id, file_name, file_url, file_size, file_type)
        return {
            "success": True,
            "message": "File uploaded successfully",
            "data": file_obj
        }

    @staticmethod
    async def get_file(db: AsyncSession, file_id: UUID):
        file_obj = await FileService.get_file_by_id(db, file_id)
        if not file_obj:
            return {
                "success": False,
                "message": "File not found",
                "data": None
            }
        return {
            "success": True,
            "message": "File fetched successfully",
            "data": file_obj
        }

    @staticmethod
    async def update_file(db: AsyncSession, file_id: UUID, file_data: FileUpdate):
        file_obj = await FileService.update_file(db, file_id, file_data)
        if not file_obj:
            return {
                "success": False,
                "message": "File not found",
                "data": None
            }
        return {
            "success": True,
            "message": "File updated successfully",
            "data": file_obj
        }

    @staticmethod
    async def delete_file(db: AsyncSession, file_id: UUID):
        success = await FileService.delete_file(db, file_id)
        if not success:
            return {
                "success": False,
                "message": "File not found",
                "data": None
            }
        return {
            "success": True,
            "message": "File deleted successfully",
            "data": None
        }