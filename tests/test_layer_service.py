from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.database import Base
from core.exceptions import NotFoundError, VersionConflictError
from models import Job, JobStatus, Translation, TranslationStatus
from services.layer_service import LayerService


@pytest.fixture()
def session_factory():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    SessionTesting = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def _factory():
        return SessionTesting()

    yield _factory
    Base.metadata.drop_all(engine)


def _create_translation(session, *, translation_id: str = "tr-1") -> str:
    job = Job(id="job-1", status=JobStatus.PENDING, images_count=1)
    session.add(job)
    translation = Translation(
        id=translation_id,
        job_id=job.id,
        image_uuid="img-1",
        order_index=0,
        original_path="/tmp/original.png",
        source_lang="en",
        target_lang="zh",
        field="e-commerce",
        enable_postprocess=True,
        status=TranslationStatus.PENDING,
    )
    session.add(translation)
    session.commit()
    return translation.id


def test_create_and_list_layers(session_factory):
    service = LayerService(session_factory)
    with session_factory() as session:
        translation_id = _create_translation(session)

    layer = service.create_layer(
        translation_id=translation_id,
        bbox=[0, 0, 100, 50],
        original_text="Hello",
        translated_text="你好",
        style={"fontFamily": "Arial"},
    )

    layers = service.list_layers(translation_id)
    assert len(layers) == 1
    assert layers[0].id == layer.id


def test_update_layer_with_version(session_factory):
    service = LayerService(session_factory)
    with session_factory() as session:
        translation_id = _create_translation(session)

    layer = service.create_layer(
        translation_id=translation_id,
        bbox=[0, 0, 10, 10],
        original_text="A",
        translated_text="甲",
        style={"fontFamily": "Arial", "fontSize": 12},
    )

    updated = service.update_layer(
        layer.id,
        translated_text="乙",
        style_updates={"fontSize": 16},
        version=layer.version,
    )

    assert updated.version == layer.version + 1
    assert updated.translated_text == "乙"
    assert updated.style["fontSize"] == 16


def test_update_layer_version_conflict(session_factory):
    service = LayerService(session_factory)
    with session_factory() as session:
        translation_id = _create_translation(session)

    layer = service.create_layer(
        translation_id=translation_id,
        bbox=[0, 0, 10, 10],
        original_text="A",
        translated_text="甲",
        style={"fontFamily": "Arial"},
    )

    with pytest.raises(VersionConflictError):
        service.update_layer(layer.id, translated_text="乙", style_updates=None, version=layer.version + 1)


def test_batch_update_layers(session_factory):
    service = LayerService(session_factory)
    with session_factory() as session:
        translation_id = _create_translation(session)

    layer_one = service.create_layer(
        translation_id=translation_id,
        bbox=[0, 0, 10, 10],
        original_text="A",
        translated_text="甲",
        style={"fontFamily": "Arial"},
    )
    layer_two = service.create_layer(
        translation_id=translation_id,
        bbox=[10, 10, 20, 20],
        original_text="B",
        translated_text="乙",
        style={"fontFamily": "Arial"},
    )

    updated = service.batch_update(
        translation_id,
        [
            {"id": layer_one.id, "translated_text": "甲甲", "version": layer_one.version},
            {"id": layer_two.id, "style": {"fontColor": "#ff0000"}, "version": layer_two.version},
        ],
    )

    assert {l.id for l in updated} == {layer_one.id, layer_two.id}
    l1 = next(l for l in updated if l.id == layer_one.id)
    assert l1.translated_text == "甲甲"
    l2 = next(l for l in updated if l.id == layer_two.id)
    assert l2.style["fontColor"] == "#ff0000"


def test_batch_update_missing_layer(session_factory):
    service = LayerService(session_factory)
    with session_factory() as session:
        translation_id = _create_translation(session)

    service.create_layer(
        translation_id=translation_id,
        bbox=[0, 0, 10, 10],
        original_text="A",
        translated_text="甲",
        style={"fontFamily": "Arial"},
    )

    with pytest.raises(NotFoundError):
        service.batch_update(
            translation_id,
            [
                {"id": "missing", "translated_text": "x", "version": 1},
            ],
        )
