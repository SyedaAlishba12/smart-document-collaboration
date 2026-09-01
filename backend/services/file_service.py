import os
import boto3
from botocore.client import Config
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from models.file import File
from models.document_attachment import DocumentAttachment
from schemas.file_schema import FileUpdate
import uuid

# Fetch endpoint and bucket name dynamically from environment variables
R2_ENDPOINT = os.getenv("R2_ENDPOINT_URL", "https://6c5ebb1f5015d25630b4a0fe6e8a5bfe.r2.cloudflarestorage.com")
BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "smart-document-storage")

# Initialize Cloudflare R2 client securely with path addressing
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    config=Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}
    ),
    region_name='auto'
)

class FileService:
    @staticmethod
    async def upload_file_to_r2(file_obj, file_name: str) -> str:
        try:
            # Generate a unique object key for storage
            file_extension = os.path.splitext(file_name)[1]
            unique_file_key = f"{uuid.uuid4()}{file_extension}"
            
            s3_client.upload_fileobj(
                file_obj, 
                BUCKET_NAME, 
                unique_file_key,
                ExtraArgs={"ContentType": getattr(file_obj, "content_type", "application/octet-stream")}
            )
            # Store the unique key or a relative identifier instead of direct public endpoint URL
            return unique_file_key
        except Exception as e:
            raise Exception(f"R2 Upload Failed: {str(e)}")

    @staticmethod
    async def create_file_record(db: AsyncSession, uploader_id, file_name: str, file_url: str, file_size: int, file_type: str):
        file_obj = File(
            uploader_id=uploader_id,
            file_name=file_name,
            file_url=file_url,
            file_size=file_size,
            file_type=file_type
        )
        db.add(file_obj)
        await db.commit()
        await db.refresh(file_obj)
        return file_obj

    @staticmethod
    async def get_presigned_download_url(file_url: str, expiration: int = 3600) -> str:
        try:
            # Safely handle both full URLs or direct keys stored in database
            parsed_key = file_url.split("/")[-1] if "/" in file_url else file_url
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': parsed_key},
                ExpiresIn=expiration
            )
            return presigned_url
        except Exception as e:
            raise Exception(f"Failed to generate download link: {str(e)}")

    @staticmethod
    async def update_file(db: AsyncSession, file_id: UUID, file_data: FileUpdate) -> File | None:
        file_obj = await FileService.get_file_by_id(db, file_id)
        if not file_obj:
            return None
        
        if file_data.file_name is not None:
            file_obj.file_name = file_data.file_name
        
        await db.commit()
        await db.refresh(file_obj)
        return file_obj

    @staticmethod
    async def delete_file(db: AsyncSession, file_id: UUID) -> bool:
        file_obj = await FileService.get_file_by_id(db, file_id)
        if not file_obj:
            return False
        
        try:
            parsed_key = file_obj.file_url.split("/")[-1] if "/" in file_obj.file_url else file_obj.file_url
            s3_client.delete_object(Bucket=BUCKET_NAME, Key=parsed_key)
        except Exception:
            pass

        await db.delete(file_obj)
        await db.commit()
        return True
    
    @staticmethod
    async def get_file_by_id(db: AsyncSession, file_id: str):
        result = await db.execute(select(File).where(File.id == file_id))
        return result.scalars().first()