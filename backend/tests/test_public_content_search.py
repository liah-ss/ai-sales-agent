from datetime import date
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import DeliveryCase, NewsArticle, Solution


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


class PublicContentSearchTest(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides[get_db] = override_get_db
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        with TestingSessionLocal() as db:
            self.seed_content(db)

    @staticmethod
    def seed_content(db: Session) -> None:
        db.add(Solution(
            title="园区配电升级方案",
            slug="park-power-upgrade",
            icon=None,
            summary="面向制造园区",
            content="适配印尼工业园的供配电条件",
            document_sections=[],
            images=[],
            scenarios=[],
            equipment=[],
            benefits=[],
            detailed_description=None,
            pitfalls=[],
            core_parameters=[],
            special_contributions=[],
            related_products=[],
            translations={"en": {"title": "Industrial park power upgrade"}},
            sort_order=1,
            is_active=True,
        ))
        db.add(DeliveryCase(
            title="数据中心交付项目",
            slug="data-center-delivery",
            summary="完整设备交付",
            content="项目正文",
            project_overview="海外数据中心供电建设",
            indonesia_fit="符合当地电网条件",
            professional_configuration="IEC 标准配置",
            key_parameter_table=[],
            delivery_challenges=[{"challenge": "现场吊装", "solution": "分段运输"}],
            project_results="顺利投运",
            thumbnail_url=None,
            client_name="示例客户",
            industry="数据中心",
            location="总部",
            translations={},
            delivered_at=date(2026, 1, 1),
            sort_order=1,
            is_active=True,
        ))
        db.add(NewsArticle(
            title="电网技术观察",
            slug="grid-technology",
            summary="行业趋势分析",
            content="智能电网设备进入新一轮升级周期",
            thumbnail_url=None,
            source="行业资讯",
            translations={"id": {"title": "Teknologi jaringan pintar"}},
            published_at=date(2026, 2, 1),
            sort_order=1,
            is_active=True,
        ))
        db.commit()

    def test_searches_solution_body_and_translation(self) -> None:
        self.assertEqual(client.get("/api/solutions?q=印尼工业园").json()[0]["slug"], "park-power-upgrade")
        self.assertEqual(client.get("/api/solutions?q=Industrial").json()[0]["slug"], "park-power-upgrade")

    def test_searches_delivery_case_structured_content(self) -> None:
        response = client.get("/api/delivery-cases?q=现场吊装")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["slug"], "data-center-delivery")

    def test_searches_news_body_and_translation(self) -> None:
        self.assertEqual(client.get("/api/news?q=智能电网").json()["items"][0]["slug"], "grid-technology")
        self.assertEqual(client.get("/api/news?q=jaringan").json()["items"][0]["slug"], "grid-technology")


if __name__ == "__main__":
    unittest.main()
