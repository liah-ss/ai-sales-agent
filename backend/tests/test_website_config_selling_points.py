from copy import deepcopy

from app.routers.website_config import normalize_platform_selling_points
from app.services.website_config_defaults import get_default_website_config


def test_legacy_platform_selling_points_migrate_to_new_homepage_copy_in_order() -> None:
    payload = {
        "platformSellingPoints": [
            {
                "id": "platform-certified",
                "icon": "shield",
                "title": "ISO & CE 认证保障",
                "content": "国际质量体系认证，出口产品资料与合规文件齐全。",
                "enabled": True,
            },
            {
                "id": "platform-service",
                "icon": "headphones",
                "title": "7x24 专属客服",
                "content": "电力选型顾问快速响应采购需求，协助完成方案确认。",
                "enabled": True,
            },
            {
                "id": "platform-delivery",
                "icon": "globe",
                "title": "全球交付网络",
                "content": "覆盖 50+ 国家和地区，提供物流、报关与交付支持。",
                "enabled": True,
            },
        ],
    }
    defaults = deepcopy(get_default_website_config())

    normalize_platform_selling_points(payload, defaults)

    points = payload["platformSellingPoints"]
    assert [point["title"] for point in points] == ["一站式EPC解决", "东南亚本地化服务", "SNI&IEC标准"]
    assert points[0]["contentTranslations"]["zh-CN"].startswith("统一负责，直连5000+")
    assert points[1]["contentTranslations"]["zh-CN"].startswith("快速现场响应")
    assert points[2]["contentTranslations"]["zh-CN"] == "国际质量体系认证，出口产品资料与合规文件齐全。"
