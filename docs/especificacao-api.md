# Especificação das APIs Auxiliares (UniLaunch)

Este documento especifica o contrato e comportamento dos microsserviços externos consumidos pelo GreenER.

---

## 1. Greener Metrics Aggregator API
* **URL de Produção:** `https://metrics.unilaunch.org`
* **Descrição:** Microsserviço que simula a infraestrutura corporativa, listando os serviços ativos e fornecendo suas métricas computacionais em tempo real.

### Endpoints
* **`GET /health`**
  * **Descrição:** Verifica a saúde do agregador.
  * **Retorno (200 OK):** `{ "service": "metrics-aggregator", "status": "ok", "uptime_seconds": 122 }`

* **`GET /services`**
  * **Descrição:** Retorna a lista de serviços ativos registrados no momento.
  * **Retorno (200 OK):** Array de `ServiceSummary`
    ```json
    [
      {
        "id": "billing-api",
        "name": "Billing API",
        "location": {
          "region_code": "br-sudeste",
          "country": "Brazil",
          "region": "Sudeste",
          "city": "Sao Paulo",
          "latitude": -23.5505,
          "longitude": -46.6333
        },
        "metrics_path": "/metrics/billing-api"
      }
    ]
    ```

* **`GET /services/{id}`**
  * **Descrição:** Consulta o cadastro individual de um serviço descoberto.
  * **Respostas:** `200 OK` (Serviço encontrado) | `404 Not Found` (Serviço não listado).

* **`GET /metrics/{service_id}`**
  * **Descrição:** Coleta as métricas computacionais instantâneas do serviço.
  * **Respostas:**
    * **`200 OK`:** Métricas coletadas com sucesso.
      ```json
      {
        "collection_interval_seconds": 27,
        "metrics": {
          "cpu_percent": 62.67,
          "memory_gb": 3.17,
          "disk_gb": 19.26,
          "network_gb": 0.45
        }
      }
      ```
    * **`404 Not Found`:** Serviço removido do registro ou sem métricas (`metrics_missing`).
    * **`500 Internal Server Error`:** Serviço ou exportador indisponível (`unavailable`).

---

## 2. Greener Carbon Intensity API
* **URL de Produção:** `https://carbon.unilaunch.org`
* **Descrição:** Fornece o fator de intensidade de carbono (gCO₂e/kWh) e percentual de fontes renováveis da matriz elétrica regional.

### Endpoints
* **`GET /health`**
  * **Descrição:** Verifica a saúde do serviço.
  * **Retorno (200 OK):** `{ "service": "carbon-intensity", "status": "ok" }`

* **`GET /regions`**
  * **Descrição:** Lista todas as regiões cadastradas e seus fatores regionais.
  * **Retorno (200 OK):** Lista com `code`, `country`, `region`, `city`, `latitude`, `longitude`, `carbon_intensity_gco2e_per_kwh` e `renewable_share_percent`.

* **`GET /regions/{code}/carbon-intensity`** (Alias: `GET /carbon-intensity/{code}`)
  * **Descrição:** Retorna a intensidade de carbono referente ao `region_code` informado.
  * **Retorno (200 OK):**
    ```json
    {
      "region_code": "br-sudeste",
      "country": "Brazil",
      "region": "Sudeste",
      "city": "Sao Paulo",
      "carbon_intensity_gco2e_per_kwh": 85.0,
      "renewable_share_percent": 83.0
    }
    ```
  * **Resposta (404 Not Found):** Região não encontrada no cadastro.
