import os
import boto3
from botocore.client import Config
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from models.file import File
from models.document_attachment import DocumentAttachment
from schemas.file_schema import FileUpdate

# Cloudflare R2 S3-compatible client setup
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv("R2_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "smart-document-storage")

class FileService:
    @staticmethod
    async def upload_file_to_r2(file_obj, file_name: str) -> str:
        try:
            # Uploading File on Cloudflare R2 bucket 
            s3_client.upload_fileobj(file_obj, BUCKET_NAME, file_name)
            # generating File's public/access URL 
            endpoint = os.getenv("R2_ENDPOINT_URL").replace("https://", f"https://{BUCKET_NAME}.")
            file_url = f"{endpoint}/{file_name}"
            return file_url
        except Exception as e:
            raise Exception(f"R2 Upload Failed: {str(e)}")

    @staticmethod
    async def create_file_record(
        db: AsyncSession, 
        uploader_id: UUID, 
        file_name: str, 
        file_url: str, 
        file_size: int, 
        file_type: str
    ) -> File:
        new_file = File(
            uploader_id=uploader_id,
            file_name=file_name,
            file_url=file_url,
            file_size=file_size,
            file_type=file_type
        )
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        return new_file

    @staticmethod
    async def get_file_by_id(db: AsyncSession, file_id: UUID) -> File | None:
        result = await db.execute(select(File).where(File.id == file_id))
        return result.scalars().first()

    @staticmethod
    async def update_file(db: AsyncSession, file_id: UUID, file_data: FileUpdate) -> File | None:
        file_obj = await FileService.get_file_by_id(db, file_id)
        if not file_obj:
            return None
        
        file_obj.file_name = file_data.file_name
        await db.commit()
        await db.refresh(file_obj)
        return file_obj

    @staticmethod
    async def delete_file(db: AsyncSession, file_id: UUID) -> bool:
        file_obj = await FileService.get_file_by_id(db, file_id)
        if not file_obj:
            return False
        
        await db.delete(file_obj)
        await db.commit()
        return True

    @staticmethod
    async def attach_file_to_document(db: AsyncSession, document_id: UUID, file_id: UUID) -> DocumentAttachment:
        attachment = DocumentAttachment(
            document_id=document_id,
            file_id=file_id
        )
        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)
        return attachment