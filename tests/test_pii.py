"""Testes do módulo de redação PII (RF-1.2, RNF-1)."""

from open_agentic_ops.pii import detectar_pii, redigir_texto, sanitizar_payload


def test_redige_cpf():
    assert redigir_texto("CPF 123.456.789-00") == "CPF [CPF]"


def test_redige_email_e_telefone():
    texto = "contato joao@exemplo.com tel (11) 98765-4321"
    saida = redigir_texto(texto)
    assert "[EMAIL]" in saida
    assert "[TELEFONE]" in saida


def test_redige_data_nascimento():
    assert redigir_texto("nasc 01/02/1990") == "nasc [DATA_NASC]"


def test_sanitiza_payload_recursivo():
    payload = {
        "nome": "Maria",
        "contato": {"email": "maria@x.com", "tel": "11999998888"},
        "lista": ["a@b.com"],
    }
    saida = sanitizar_payload(payload)
    assert saida["contato"]["email"] == "[EMAIL]"
    assert saida["lista"] == ["[EMAIL]"]
    assert saida["nome"] == "Maria"


def test_detecta_pii_classifica_lgpd():
    encontradas = detectar_pii("CPF 123.456.789-00 email a@b.com")
    categorias = {c.value for c, _ in encontradas}
    assert "sensivel" in categorias
    assert "pessoal" in categorias


def test_redige_chave_pix_uuid():
    texto = "chave pix 123e4567-e89b-12d3-a456-426614174000"
    saida = redigir_texto(texto)
    assert "[CHAVE_PIX]" in saida
    assert "123e4567-e89b-12d3-a456-426614174000" not in saida


def test_redige_conta_agencia():
    texto = "ag 1234-5 conta 56789-0"
    saida = redigir_texto(texto)
    assert "[CONTA]" in saida
    assert "1234-5" not in saida
    assert "56789-0" not in saida


def test_detecta_pii_financeiro_classifica_sensivel():
    encontradas = detectar_pii("chave 123e4567-e89b-12d3-a456-426614174000 ag 1234-5 conta 56789-0")
    rotulos = {r for _, r in encontradas}
    assert "CHAVE_PIX" in rotulos
    assert "CONTA_BANCARIA" in rotulos
    categorias = {c.value for c, _ in encontradas}
    assert "sensivel" in categorias
