from app.services.content_sanitizer import sanitize_rich_html


def test_sanitizer_keeps_semantics_and_removes_active_content() -> None:
    html = (
        '<h2>标题</h2><p onclick="alert(1)">正文</p>'
        '<script>x()</script><img src="data:image/png;base64,abc">'
    )

    cleaned = sanitize_rich_html(html)

    assert "<h2>标题</h2>" in cleaned
    assert "<p>正文</p>" in cleaned
    assert "onclick" not in cleaned
    assert "script" not in cleaned
    assert "data:image" not in cleaned


def test_sanitizer_keeps_managed_images_and_safe_links() -> None:
    html = '<p><a href="https://example.com">资料</a></p><img src="/uploads/images/a.png" alt="设备">'

    cleaned = sanitize_rich_html(html)

    assert 'href="https://example.com"' in cleaned
    assert 'src="/uploads/images/a.png"' in cleaned
    assert 'alt="设备"' in cleaned


def test_sanitizer_keeps_safe_word_styles_and_removes_unsafe_css() -> None:
    html = (
        '<h1 style="font-size:24pt;color:#123456;text-align:center;position:fixed" onclick="x()">Title</h1>'
        '<p style="font-family:Arial;margin-left:36pt">Body</p><script>x()</script>'
    )

    cleaned = sanitize_rich_html(html)

    assert '<h1 style="font-size:24pt;color:#123456;text-align:center">Title</h1>' in cleaned
    assert '<p style="font-family:Arial;margin-left:36pt">Body</p>' in cleaned
    assert "position" not in cleaned
    assert "onclick" not in cleaned
    assert "script" not in cleaned
