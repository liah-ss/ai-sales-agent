from app.routers.site_settings import parse_value, sync_phone_display_text


def test_numeric_phone_text_is_not_coerced_to_an_integer() -> None:
    assert parse_value("17772151200") == "17772151200"
    assert isinstance(parse_value("17772151200"), str)


def test_phone_updates_legacy_topbar_phone_text_and_translations() -> None:
    settings = {
        "phone": "139-0000-1234",
        "topbar_phone_text": "📞 0000-0000-0000",
        "translations": {
            "en": {"topbar_phone_text": "📞 0000-0000-0000"},
            "id": {"topbar_phone_text": "Call 0000-0000-0000"},
        },
    }

    sync_phone_display_text(settings)

    assert settings["topbar_phone_text"] == "📞 139-0000-1234"
    assert settings["translations"]["en"]["topbar_phone_text"] == "📞 139-0000-1234"
    assert settings["translations"]["id"]["topbar_phone_text"] == "Call 139-0000-1234"


def test_custom_topbar_copy_without_phone_is_preserved() -> None:
    settings = {
        "phone": "139-0000-1234",
        "topbar_phone_text": "Contact our sales team",
        "translations": {"en": {"topbar_phone_text": "Talk to sales"}},
    }

    sync_phone_display_text(settings)

    assert settings["topbar_phone_text"] == "Contact our sales team"
    assert settings["translations"]["en"]["topbar_phone_text"] == "Talk to sales"
