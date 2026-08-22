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
