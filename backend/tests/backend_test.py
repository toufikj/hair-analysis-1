"""TrichoCare Clinic backend API tests"""
import os
import io
import base64
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

CONDITIONS = [
    'Alopecia', 'Dandruff / Seborrheic dermatitis', 'Psoriasis',
    'Folliculitis', 'Healthy scalp', 'Needs review'
]

# 1x1 PNG bytes
PNG_BYTES = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
)


@pytest.fixture(scope='module')
def created_patient_ids():
    ids = []
    yield ids
    # teardown - no cascading delete in API; ok to leave test data


# --- Health & metadata ---
class TestMeta:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json() == {'status': 'ok'}

    def test_conditions(self):
        r = requests.get(f"{API}/conditions", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data['conditions'] == CONDITIONS


# --- Patient CRUD ---
class TestPatients:
    def test_create_patient(self, created_patient_ids):
        payload = {'name': 'TEST_Maya Patel', 'phone': '+1 555 010 2400',
                   'notes': 'Initial scalp examination'}
        r = requests.post(f"{API}/patients", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data['name'] == payload['name']
        assert data['phone'] == payload['phone']
        assert data['notes'] == payload['notes']
        assert data['photo_count'] == 0
        assert data['conditions'] == []
        assert 'id' in data and isinstance(data['id'], str)
        assert '_id' not in data
        created_patient_ids.append(data['id'])

    def test_create_patient_missing_fields(self):
        r = requests.post(f"{API}/patients", json={'name': '', 'phone': ''}, timeout=15)
        assert r.status_code == 400

    def test_list_patients(self, created_patient_ids):
        r = requests.get(f"{API}/patients", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = [p['id'] for p in data]
        assert created_patient_ids[0] in ids

    def test_search_patient(self, created_patient_ids):
        r = requests.get(f"{API}/patients", params={'search': 'TEST_Maya'}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert any(p['id'] == created_patient_ids[0] for p in data)

    def test_get_patient(self, created_patient_ids):
        pid = created_patient_ids[0]
        r = requests.get(f"{API}/patients/{pid}", timeout=15)
        assert r.status_code == 200
        assert r.json()['id'] == pid

    def test_get_missing_patient(self):
        r = requests.get(f"{API}/patients/nonexistent-id", timeout=15)
        assert r.status_code == 404


# --- Photos ---
class TestPhotos:
    def test_upload_photo_default_needs_review(self, created_patient_ids):
        pid = created_patient_ids[0]
        files = {'file': ('scalp.png', io.BytesIO(PNG_BYTES), 'image/png')}
        data = {'conditions': 'Needs review'}
        r = requests.post(f"{API}/patients/{pid}/photos", files=files, data=data, timeout=30)
        assert r.status_code == 200, r.text
        photo = r.json()
        assert photo['patient_id'] == pid
        assert photo['content_type'] == 'image/png'
        assert photo['data_url'].startswith('data:image/png;base64,')
        assert photo['conditions'] == ['Needs review']
        assert 'id' in photo
        # verify patient counters updated
        pr = requests.get(f"{API}/patients/{pid}", timeout=15).json()
        assert pr['photo_count'] == 1
        assert 'Needs review' in pr['conditions']
        # store photo id for delete test
        TestPhotos.photo_id = photo['id']

    def test_upload_multiple_conditions(self, created_patient_ids):
        pid = created_patient_ids[0]
        files = {'file': ('scalp2.png', io.BytesIO(PNG_BYTES), 'image/png')}
        data = {'conditions': 'Alopecia|Psoriasis', 'note': 'multi tag'}
        r = requests.post(f"{API}/patients/{pid}/photos", files=files, data=data, timeout=30)
        assert r.status_code == 200
        photo = r.json()
        assert set(photo['conditions']) == {'Alopecia', 'Psoriasis'}
        assert photo['note'] == 'multi tag'

    def test_upload_ignores_unknown_condition(self, created_patient_ids):
        pid = created_patient_ids[0]
        files = {'file': ('scalp3.png', io.BytesIO(PNG_BYTES), 'image/png')}
        data = {'conditions': 'FakeCondition|Folliculitis'}
        r = requests.post(f"{API}/patients/{pid}/photos", files=files, data=data, timeout=30)
        assert r.status_code == 200
        assert r.json()['conditions'] == ['Folliculitis']

    def test_upload_rejects_non_image(self, created_patient_ids):
        pid = created_patient_ids[0]
        files = {'file': ('a.txt', io.BytesIO(b'hello'), 'text/plain')}
        r = requests.post(f"{API}/patients/{pid}/photos", files=files, data={}, timeout=15)
        assert r.status_code == 400

    def test_upload_missing_patient(self):
        files = {'file': ('scalp.png', io.BytesIO(PNG_BYTES), 'image/png')}
        r = requests.post(f"{API}/patients/does-not-exist/photos", files=files, data={}, timeout=15)
        assert r.status_code == 404

    def test_list_photos(self, created_patient_ids):
        pid = created_patient_ids[0]
        r = requests.get(f"{API}/patients/{pid}/photos", timeout=15)
        assert r.status_code == 200
        photos = r.json()
        assert len(photos) >= 3
        assert all('_id' not in p for p in photos)

    def test_delete_photo(self, created_patient_ids):
        pid = created_patient_ids[0]
        photo_id = getattr(TestPhotos, 'photo_id', None)
        assert photo_id, 'no photo captured'
        r = requests.delete(f"{API}/photos/{photo_id}", timeout=15)
        assert r.status_code == 200
        assert r.json() == {'deleted': True}
        # verify gone
        photos = requests.get(f"{API}/patients/{pid}/photos", timeout=15).json()
        assert not any(p['id'] == photo_id for p in photos)

    def test_delete_missing_photo(self):
        r = requests.delete(f"{API}/photos/nonexistent", timeout=15)
        assert r.status_code == 404


# --- Patient update ---
class TestPatientUpdate:
    def test_patch_patient(self, created_patient_ids):
        pid = created_patient_ids[0]
        r = requests.patch(f"{API}/patients/{pid}",
                           json={'name': 'TEST_Maya P.', 'phone': '+1 555 999 0000', 'notes': 'updated'},
                           timeout=15)
        assert r.status_code == 200
        assert r.json()['name'] == 'TEST_Maya P.'
        # verify persistence
        r2 = requests.get(f"{API}/patients/{pid}", timeout=15)
        assert r2.json()['notes'] == 'updated'
