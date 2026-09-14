import pytest
from pydantic import ValidationError

from app.schemas.management_catalog import ManagementCategoryIn, ManagementProductIn


def product_payload() -> dict[str, object]:
    return {
        "product_code": "P-T001",
        "category_id": 2,
        "name": "Test product",
        "slug": "test-product",
        "model": "T-100",
        "summary": "Test summary",
    }


def test_product_accepts_three_tiers_and_defaults_visibility() -> None:
    payload = product_payload()
    payload["price_tiers"] = [
        {"label": "第一档", "range": "1-10", "price": "¥100"},
        {"label": "第二档", "range": "11-20", "price": "¥90", "visible": False},
        {"label": "第三档", "range": "21+", "price": "询盘有惊喜"},
    ]

    model = ManagementProductIn.model_validate(payload)

    assert [item.visible for item in model.price_tiers] == [True, False, True]


def test_product_rejects_four_price_tiers() -> None:
    payload = product_payload()
    payload["price_tiers"] = [
        {"label": str(index), "range": str(index), "price": str(index)}
        for index in range(4)
    ]

    with pytest.raises(ValidationError):
        ManagementProductIn.model_validate(payload)


def test_fulfillment_items_accept_structured_rows_and_legacy_methods() -> None:
    product = ManagementProductIn.model_validate({
        **product_payload(),
        "fulfillment_items": [{"name": "全球海运", "copy": "支持门到门"}],
    })
    category = ManagementCategoryIn.model_validate({
        "name": "变压器",
        "slug": "transformers",
        "fulfillment_methods": ["跨境陆运"],
    })

    assert product.fulfillment_items[0].model_dump() == {"name": "全球海运", "copy": "支持门到门"}
    assert category.fulfillment_items[0].model_dump() == {"name": "跨境陆运", "copy": ""}


def test_product_accepts_up_to_four_configurable_process_items() -> None:
    payload = product_payload()
    payload["process_items"] = [
        {"title": "需求确认", "copy": "确认参数"},
        {"title": "工厂匹配", "copy": "匹配产能"},
        {"title": "订单交易", "copy": "确认合同。"},
        {"title": "发货管控", "copy": "跟踪物流"},
    ]

    model = ManagementProductIn.model_validate(payload)

    assert [item.title for item in model.process_items] == ["需求确认", "工厂匹配", "订单交易", "发货管控"]


def test_product_rejects_more_than_four_process_items() -> None:
    payload = product_payload()
    payload["process_items"] = [{"title": str(index), "copy": "说明"} for index in range(5)]

    with pytest.raises(ValidationError):
        ManagementProductIn.model_validate(payload)


def test_rich_text_detail_blocks_are_sanitized() -> None:
    payload = product_payload()
    payload["detail_blocks"] = [{
        "type": "rich-text",
        "content": '<h1 style="font-size:24pt" onclick="x()">Title</h1><script>x()</script>',
    }]

    model = ManagementProductIn.model_validate(payload)

    assert model.detail_blocks[0].content == '<h1 style="font-size:24pt">Title</h1>'


def test_localized_rich_text_detail_blocks_are_sanitized() -> None:
    payload = product_payload()
    payload["translations"] = {
        "id": {
            "detail_blocks": [{
                "type": "rich-text",
                "content": '<p style="color:red" onclick="x()">Isi</p><script>x()</script>',
            }],
        },
    }

    model = ManagementProductIn.model_validate(payload)

    assert model.translations["id"]["detail_blocks"][0]["content"] == '<p style="color:red">Isi</p>'
