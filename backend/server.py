from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from pathlib import Path
from datetime import datetime, timezone
import os, uuid, base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
app = FastAPI(title='TrichoCare Clinic API')
api = APIRouter(prefix='/api')

CONDITIONS = ['Alopecia', 'Dandruff / Seborrheic dermatitis', 'Psoriasis', 'Folliculitis', 'Healthy scalp', 'Needs review']

class PatientCreate(BaseModel):
    name: str
    phone: str
    notes: str = ''

class Patient(PatientCreate):
    id: str
    created_at: str
    photo_count: int = 0
    conditions: List[str] = []

class Photo(BaseModel):
    id: str
    patient_id: str
    filename: str
    content_type: str
    data_url: str
    conditions: List[str] = []
    note: str = ''
    created_at: str

def clean(doc):
    doc.pop('_id', None)
    return doc

@api.get('/health')
async def health(): return {'status': 'ok'}

@api.get('/conditions')
async def conditions(): return {'conditions': CONDITIONS}

@api.get('/patients', response_model=List[Patient])
async def list_patients(search: str = ''):
    query = {'name': {'$regex': search, '$options': 'i'}} if search else {}
    patients = await db.patients.find(query, {'_id': 0}).sort('created_at', -1).to_list(500)
    return patients

@api.post('/patients', response_model=Patient)
async def create_patient(payload: PatientCreate):
    if not payload.name.strip() or not payload.phone.strip():
        raise HTTPException(400, 'Name and phone are required')
    doc = {**payload.model_dump(), 'id': str(uuid.uuid4()), 'created_at': datetime.now(timezone.utc).isoformat(), 'photo_count': 0, 'conditions': []}
    await db.patients.insert_one(doc)
    return clean(doc)

@api.get('/patients/{patient_id}', response_model=Patient)
async def get_patient(patient_id: str):
    doc = await db.patients.find_one({'id': patient_id}, {'_id': 0})
    if not doc: raise HTTPException(404, 'Patient not found')
    return doc

@api.patch('/patients/{patient_id}', response_model=Patient)
async def update_patient(patient_id: str, payload: PatientCreate):
    await db.patients.update_one({'id': patient_id}, {'$set': payload.model_dump()})
    doc = await db.patients.find_one({'id': patient_id}, {'_id': 0})
    if not doc: raise HTTPException(404, 'Patient not found')
    return doc

@api.get('/patients/{patient_id}/photos', response_model=List[Photo])
async def list_photos(patient_id: str):
    return await db.photos.find({'patient_id': patient_id}, {'_id': 0}).sort('created_at', -1).to_list(500)

@api.post('/patients/{patient_id}/photos', response_model=Photo)
async def upload_photo(patient_id: str, file: UploadFile = File(...), conditions: str = Form(''), note: str = Form('')):
    patient = await db.patients.find_one({'id': patient_id}, {'_id': 0, 'id': 1})
    if not patient: raise HTTPException(404, 'Patient not found')
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(400, 'Please upload an image file')
    raw = await file.read()
    if len(raw) > 12 * 1024 * 1024: raise HTTPException(400, 'Image must be under 12 MB')
    tags = [x for x in conditions.split('|') if x in CONDITIONS]
    doc = {'id': str(uuid.uuid4()), 'patient_id': patient_id, 'filename': file.filename or 'dermascope-image', 'content_type': file.content_type, 'data_url': f'data:{file.content_type};base64,{base64.b64encode(raw).decode()}', 'conditions': tags, 'note': note, 'created_at': datetime.now(timezone.utc).isoformat()}
    await db.photos.insert_one(doc)
    await db.patients.update_one({'id': patient_id}, {'$inc': {'photo_count': 1}, '$addToSet': {'conditions': {'$each': tags}}})
    return clean(doc)

@api.delete('/photos/{photo_id}')
async def delete_photo(photo_id: str):
    result = await db.photos.delete_one({'id': photo_id})
    if not result.deleted_count: raise HTTPException(404, 'Photo not found')
    return {'deleted': True}

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=['*'], allow_headers=['*'])

@app.on_event('shutdown')
async def shutdown(): client.close()