"""Backend simples: valida e calcula notas (Flask).
"""

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Conversor de tipos

def _to_float(value, field_name):
    """Converte para float ou lança ValueError."""
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} inválido")

# Cálculo e validação de um quadro

def _calcular_quadro(nome, quadro):
    """Valida notas/pesos e retorna parcial e final do quadro."""
    notas = quadro.get("notas", [])
    peso_quadro = _to_float(quadro.get("pesoQuadro", 0), f"Peso do {nome}")

    if peso_quadro < 0 or peso_quadro > 100:
        raise ValueError(f"Peso do {nome} deve estar entre 0 e 100")

    soma_pesos = 0.0
    parcial = 0.0
    notas_normalizadas = []

    for i, item in enumerate(notas):
        nota = _to_float(item.get("nota", 0), f"Nota {i + 1} do {nome}")
        peso = _to_float(item.get("peso", 0), f"Peso {i + 1} do {nome}")

        if nota < 0 or nota > 10:
            raise ValueError(f"Nota {i + 1} do {nome} deve estar entre 0 e 10")
        if peso < 0 or peso > 100:
            raise ValueError(f"Peso {i + 1} do {nome} deve estar entre 0 e 100")

        soma_pesos += peso
        parcial_nota = (nota * peso) / 100
        parcial += parcial_nota

        notas_normalizadas.append({
            "nota": nota,
            "peso": peso,
            "notaFinal": parcial_nota,
        })

    if soma_pesos > 100:
        raise ValueError(f"Soma dos pesos do {nome} não pode passar de 100")

    final = (parcial * peso_quadro) / 100
    return {
        "ativo": bool(quadro.get("ativo", False)),
        "pesoQuadro": peso_quadro,
        "notas": notas_normalizadas,
        "parcial": parcial,
        "final": final,
    }


# ============================================================================
# ROTAS HTTP
# ============================================================================

@app.route("/")
def index():
    """Rota principal - retorna o HTML da calculadora"""
    return render_template("index.html")


@app.route("/api/calcular", methods=["POST"])
def calcular():
    """
    Endpoint principal de cálculo
    
    Recebe um POST JSON com estrutura:
    {
        "quadros": {
            "A1": {"ativo": bool, "pesoQuadro": float, "notas": [...]},
            "A2": {...},
            "A3": {...}
        }
    }
    
    Retorna:
    {
        "sucesso": true,
        "quadros": {
            "A1": {resultado calculado},
            "A2": {...},
            "A3": {...}
        },
        "mediaFinal": float
    }
    
    Ou em caso de erro:
    {
        "sucesso": false,
        "erro": "Mensagem descritiva"
    }
    
    Regras aplicadas:
    - A1 sempre está ativo (obrigatório)
    - A2 é opcional (ativado por toggle no frontend)
    - A3 só funciona se A2 estiver ativo
    - Desativar A2 desativa A3 automaticamente
    """
    payload = request.get_json(silent=True) or {}
    quadros = payload.get("quadros", {})

    a1 = quadros.get("A1", {"ativo": True, "pesoQuadro": 20, "notas": []})
    a2 = quadros.get("A2", {"ativo": False, "pesoQuadro": 30, "notas": []})
    a3 = quadros.get("A3", {"ativo": False, "pesoQuadro": 50, "notas": []})

    # Regras de ativação
    a1["ativo"] = True
    if not a2.get("ativo", False):
        a3["ativo"] = False
        a3["notas"] = []

    if a3.get("ativo", False) and not a2.get("ativo", False):
        return jsonify({"sucesso": False, "erro": "Ative o A2 antes do A3"}), 400

    try:
        r1 = _calcular_quadro("A1", a1)
        r2 = _calcular_quadro("A2", a2)
        r3 = _calcular_quadro("A3", a3)
    except ValueError as exc:
        return jsonify({"sucesso": False, "erro": str(exc)}), 400

    media_final = r1["final"]
    if r2["ativo"]:
        media_final += r2["final"]
    if r3["ativo"]:
        media_final += r3["final"]

    return jsonify(
        {
            "sucesso": True,
            "quadros": {"A1": r1, "A2": r2, "A3": r3},
            "mediaFinal": media_final,
        }
    )


# ============================================================================
# INICIALIZAÇÃO DO SERVIDOR
# ============================================================================

if __name__ == "__main__":
    # Inicia o servidor Flask em modo debug
    # debug=True: Recarrega automaticamente ao editar arquivos
    # port=5000: Executa em http://localhost:5000
    app.run(debug=True, port=5000)
