# Especificação - Document Management System

**Status:** proposta para implementação  
**Versão:** 1.0

## 1. Objetivo

Disponibilizar uma aplicação web para enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e os respectivos metadados em memória.

## 2. Escopo

### Dentro do escopo

- Receber um documento por requisição HTTP e armazená-lo localmente.
- Registrar metadados do documento em memória.
- Listar documentos associados ao usuário corrente.
- Baixar um documento pelo identificador, respeitando a associação ao usuário corrente.
- Apresentar no frontend as operações de envio, listagem e download.
- Configurar porta e diretório de armazenamento por variáveis de ambiente.

### Fora do escopo

- Armazenamento em nuvem, banco de dados ou qualquer serviço externo.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Autenticação, cadastro de usuários e administração de contas.
- Busca avançada, classificação, pré-visualização e processamento de conteúdo.
- Garantia de persistência dos metadados após reinicialização do processo.

### Premissas e limites

- A aplicação é inicialmente destinada a uso local ou ambiente controlado. O identificador de usuário deve vir de um contexto confiável do servidor; o cliente não pode escolher livremente o proprietário de um documento. Enquanto não houver autenticação, o contexto local usa o proprietário padrão `local`. Isso não oferece isolamento de segurança entre pessoas e não deve ser tratado como autenticação.
- O reinício do backend limpa os metadados em memória. Arquivos persistidos no diretório local podem permanecer sem metadados correspondentes; reconciliar ou remover esses arquivos não faz parte desta versão.
- Tipos de arquivo permitidos e tamanho máximo são decisões configuráveis antes da implementação. A implementação não deve presumir que a extensão ou o MIME informado pelo cliente prova o conteúdo do arquivo.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento usando `multipart/form-data`, no campo `file`. | Upload válido retorna `201` com os metadados criados; requisição sem arquivo ou que exceda os limites retorna erro documentado e não registra metadados. |
| RF-02 | O sistema atribui um identificador único e o proprietário corrente ao documento. | O cliente não define `id`, caminho de armazenamento ou `owner`; IDs repetidos não sobrescrevem documentos existentes. |
| RF-03 | O usuário pode listar os metadados dos documentos associados ao seu contexto. | `GET /documents` retorna `200` e uma coleção JSON; nenhum caminho interno do filesystem é exposto. |
| RF-04 | O usuário pode baixar um documento pelo identificador. | Um documento existente e pertencente ao contexto corrente é enviado como conteúdo binário, com nome de download apropriado. |
| RF-05 | O sistema rejeita acesso a documento inexistente ou fora do contexto do usuário. | A resposta é `404` nos dois casos, sem revelar se um documento de outro usuário existe. |
| RF-06 | O sistema informa erros de entrada, tamanho e operações de arquivo de maneira previsível. | Erros usam JSON consistente e não expõem stack trace, caminho local ou detalhes internos. |
| RF-07 | O frontend permite selecionar e enviar um arquivo, visualizar a lista retornada e iniciar o download. | Estados de carregamento, sucesso, lista vazia e erro são comunicados ao usuário. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Uploads devem ser gravados exclusivamente no filesystem local da aplicação, usando `multer` com `diskStorage`, em `backend/storage` por padrão. |
| RNF-02 | Metadados devem residir em memória nesta fase; nenhum banco ou armazenamento de metadados externo deve ser introduzido. |
| RNF-03 | Configurações de ambiente devem seguir o princípio 12-Factor; segredos não devem ser adicionados ao código ou ao repositório. |
| RNF-04 | O backend deve permanecer em Node.js e Express, CommonJS, com testes no runner nativo `node:test`. |
| RNF-05 | O frontend deve permanecer em React com Vite, usando `fetch` e o prefixo `/api` para chamadas ao backend. |
| RNF-06 | O backend deve separar rotas, controllers, services e repositories, com dependências fluindo somente de camadas externas para internas. |
| RNF-07 | Nomes de arquivo recebidos não podem determinar o caminho de gravação; o armazenamento usa nome interno gerado pelo servidor. |
| RNF-08 | O backend deve tratar erros de entrada e de filesystem nos limites apropriados e responder sem dados internos sensíveis. |
| RNF-09 | A API deve usar JSON para metadados e erros, e conteúdo binário apenas para downloads. |

## 5. Modelo de dados

### Documento

Os metadados são mantidos em memória e não incluem o caminho físico do arquivo na resposta pública.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | sim | Identificador único opaco, gerado pelo backend. |
| `originalName` | string | sim | Nome original normalizado para apresentação e download; não é usado como caminho físico. |
| `size` | number | sim | Tamanho do arquivo em bytes. Deve ser maior que zero para um upload aceito. |
| `uploadedAt` | string | sim | Data e hora do recebimento em ISO 8601, UTC. |
| `owner` | string | sim | Identificador lógico obtido do contexto confiável do servidor; `local` no modo local sem autenticação. |

O repository também precisa relacionar cada registro ao arquivo criado no armazenamento local, por meio de um caminho interno gerado pelo servidor. Esse dado é privado à camada de persistência e nunca é retornado pela API.

Exemplo de representação pública:

```json
{
  "id": "a1b2c3d4-e5f6-4789-8abc-0123456789ab",
  "originalName": "relatorio.pdf",
  "size": 204800,
  "uploadedAt": "2026-10-06T14:30:00.000Z",
  "owner": "local"
}
```

## 6. Contratos de API

As rotas do Express são descritas sem prefixo `/api`. No desenvolvimento, o Vite encaminha `/api/*` ao backend e remove esse prefixo; portanto, o frontend chama, por exemplo, `/api/documents`, enquanto o backend atende `/documents`.

### Formato de erro

Erros HTTP da API usam `application/json`:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para tratamento pelo frontend. `message` é uma mensagem segura e adequada ao usuário. Nenhum erro deve incluir stack trace, caminho absoluto ou conteúdo do arquivo.

### `POST /upload`

- **Finalidade:** armazenar um arquivo e criar seus metadados.
- **Entrada:** `multipart/form-data`, campo obrigatório `file` com exatamente um arquivo.
- **Processamento:** `multer` com `diskStorage`; nome físico gerado pelo servidor; proprietário obtido do contexto confiável; metadados registrados somente após gravação bem-sucedida.
- **Sucesso:** `201 Created`, `application/json`, corpo contendo o documento criado no formato público descrito acima.
- **Erros esperados:**
  - `400 Bad Request`, `FILE_REQUIRED` ou `INVALID_UPLOAD`, para arquivo ausente ou entrada multipart inválida.
  - `413 Payload Too Large`, `FILE_TOO_LARGE`, quando ultrapassado o limite configurado.
  - `415 Unsupported Media Type`, `FILE_TYPE_NOT_ALLOWED`, quando a política de tipos configurada rejeitar o arquivo.
  - `500 Internal Server Error`, `STORAGE_ERROR`, quando não for possível gravar o arquivo; nenhum metadado deve ser registrado.

O nome original serve apenas para apresentação. O backend não deve concatená-lo ao diretório de armazenamento nem confiar somente na extensão ou no MIME declarado pelo cliente para validar conteúdo.

### `GET /documents`

- **Finalidade:** listar documentos do proprietário corrente.
- **Entrada:** sem corpo. Não aceita `owner` como parâmetro para selecionar a identidade do usuário.
- **Sucesso:** `200 OK`, `application/json`:

```json
{
  "documents": [
    {
      "id": "a1b2c3d4-e5f6-4789-8abc-0123456789ab",
      "originalName": "relatorio.pdf",
      "size": 204800,
      "uploadedAt": "2026-10-06T14:30:00.000Z",
      "owner": "local"
    }
  ]
}
```

- A lista pode ser vazia. A ordem padrão é `uploadedAt` decrescente.
- Os itens não contêm caminho local nem outros dados internos.
- **Erro esperado:** `500 Internal Server Error`, `LIST_ERROR`, caso a consulta ao repository falhe.

### `GET /documents/:id/download`

- **Finalidade:** transmitir o conteúdo de um documento do proprietário corrente.
- **Entrada:** `id` opaco na rota; sem corpo.
- **Sucesso:** `200 OK`, corpo binário (`Content-Type` adequado quando conhecido, caso contrário `application/octet-stream`), com `Content-Disposition: attachment` e nome de download sanitizado.
- **Erros esperados:**
  - `400 Bad Request`, `INVALID_DOCUMENT_ID`, para identificador malformado, se houver formato validável.
  - `404 Not Found`, `DOCUMENT_NOT_FOUND`, se o documento não existir, não pertencer ao contexto corrente ou seu arquivo não estiver disponível. A resposta não distingue essas situações.
  - `500 Internal Server Error`, `DOWNLOAD_ERROR`, para falha de leitura não classificada como ausência.

O caminho do arquivo é obtido exclusivamente do repository e validado dentro do diretório de armazenamento. A rota nunca recebe um caminho de filesystem do cliente.

### Endpoint existente

`GET /health` permanece como verificação de saúde do servidor e retorna `200 OK` com `{"status":"ok"}`. Não expõe estado interno nem substitui os testes dos fluxos funcionais.

## 7. Decisões arquiteturais

### Backend

Fluxo de dependência: `routes -> controllers -> services -> repositories`.

- **Routes:** registram métodos e caminhos, conectando middlewares de upload às controllers; não contêm regras de negócio.
- **Controllers:** traduzem HTTP para chamadas de serviço, validam formato básico da requisição e montam status, headers e respostas.
- **Services:** aplicam as regras de upload, propriedade, listagem e download; não dependem de Express.
- **Repositories:** mantêm metadados em memória e encapsulam a localização/leitura dos arquivos locais. O filesystem e `multer` devem ser usados sem provedores externos.
- O app Express compõe middlewares e rotas; a inicialização do servidor permanece separada da exportação do app para permitir testes.
- Erros de upload do Multer e erros de domínio devem ser convertidos para o formato HTTP consistente na borda da aplicação.

### Frontend

- Organização em componentes, páginas e serviços, com componentes funcionais e Hooks.
- Um serviço de API centraliza as chamadas `fetch` sob `/api` e interpreta respostas de erro.
- A interface permite upload de um arquivo, atualização/consulta da lista e download por ID.
- O estado visual diferencia carregamento, sucesso, lista vazia e erro, sem expor detalhes técnicos do backend.

### Armazenamento e configuração

- Diretório padrão: `backend/storage`; pode ser substituído por variável de ambiente documentada, resolvida pelo backend.
- A porta do backend usa `PORT`, com padrão `3000`, conforme o seed atual.
- O limite de tamanho e a política de tipos aceitos devem ser configuráveis e ter valores padrão explícitos definidos durante a implementação.
- Arquivos são gravados por `multer` com `diskStorage`; metadados são mantidos somente em memória.
- Nenhuma dependência ou chamada a armazenamento externo é permitida.

## 8. Plano de execução

As etapas abaixo orientam uma implementação futura. Esta especificação não executa nem solicita alterações nos arquivos do backend ou frontend.

1. Revisar e aprovar os limites ainda configuráveis: tamanho máximo, política de tipos e identidade usada no modo local.
2. Implementar e testar o fluxo de armazenamento local e registro em memória, respeitando a separação entre rotas, controllers, services e repositories.
3. Implementar os contratos HTTP de upload, listagem e download, incluindo isolamento por proprietário e tratamento uniforme de erros.
4. Construir a experiência frontend de envio, listagem e download usando o proxy `/api` existente.
5. Validar os fluxos ponta a ponta, os casos de erro, os limites de segurança do filesystem e as instruções de execução/configuração.

## 9. Critérios gerais de aceite

- Upload válido grava o arquivo sob `backend/storage` (ou diretório configurado), cria metadados em memória e retorna `201`.
- Entradas inválidas ou acima dos limites configurados não deixam metadados inconsistentes; falhas após criação temporária removem o arquivo parcial quando aplicável.
- Listagem retorna somente documentos do contexto do proprietário corrente, sem caminho interno.
- Download retorna os bytes corretos apenas para documento disponível e pertencente ao proprietário corrente.
- IDs inexistentes e documentos de outro proprietário não podem ser diferenciados pela resposta pública.
- Os metadados desaparecem ao reiniciar o processo; essa limitação está documentada e não é mascarada como persistência durável.
- Testes backend usam `node:test`; build do frontend e testes de integração cobrem os fluxos que forem implementados nas etapas futuras.
- Nenhuma alteração a armazenamento externo, banco de dados, versionamento ou autenticação é introduzida sem revisão explícita do escopo.