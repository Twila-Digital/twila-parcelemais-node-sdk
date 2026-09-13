# Contribuindo

## Pré-requisitos

- Node.js 14 ou superior (o CI testa nas versões 14, 18 e 22)
- npm 9+

## Build e testes

```bash
npm install
npm run build
npm test
```

Rode os testes em **todas** as versões de Node que o pacote promete suportar antes de abrir o PR — não só a mais recente. Veja `SDK-PLAYBOOK.md` §2.4/§1.5 no repositório `sdks-twila`.

Os contract tests (`contract-tests/`) fazem uma chamada real ao OpenAPI de staging e não rodam por padrão:

```bash
npm test --workspace=contract-tests
```

## Instalando a partir do código-fonte

Enquanto o pacote não é publicado no npm, use o protocolo `file:` apontando para este repositório:

```json
{
  "dependencies": {
    "@twila/parcelemais": "file:../caminho/para/twila-parcelemais-node-sdk"
  }
}
```

Ou empacote localmente e consuma o tarball:

```bash
npm pack
npm install /caminho/para/twila-parcelemais-1.0.0.tgz
```

## Abrindo um PR

1. Crie uma branch a partir de `production`
2. Adicione testes para qualquer mudança de comportamento
3. Rode `npm run typecheck && npm test` localmente antes de abrir o PR
4. Abra o PR contra `production` — o CI roda build + testes automaticamente

## Release (publicação no npm)

Diferente do Maven Central, o npm tem **Trusted Publishing (OIDC) real** desde 31/07/2025 — o próprio `npm publish` troca o token OIDC do GitHub Actions por uma credencial de publish de curta duração, sem precisar de uma action separada nem de um token de longa duração guardado como secret (ver `SDK-PLAYBOOK.md` §1.6 no repositório `sdks-twila`). Exige **npm CLI ≥ 11.5.1** e **Node ≥ 22.14** no job que publica (o pacote em si continua compatível com Node 14+ para quem instala).

Antes do primeiro release, alguém com acesso à conta/organização do npm precisa configurar:

1. Criar o escopo/organização `@twila` no [npmjs.com](https://www.npmjs.com/) (se ainda não existir) — diferente do Maven Central, não precisa provar posse de domínio, só reservar o nome.
2. No pacote `@twila/parcelemais` (depois do primeiro publish manual, se for o caso, ou já na criação via **Settings → Trusted Publisher**), adicionar um Trusted Publisher:
   - **Repository owner:** `Twila-Digital`
   - **Repository:** `twila-parcelemais-node-sdk`
   - **Workflow filename:** `release.yml`
   - **Environment:** `production`
3. No repositório do GitHub, criar o [environment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment) `production` (Settings → Environments) com **Required reviewers** configurado. Nenhum secret de registry é necessário — a credencial de publish inteira vem do OIDC em runtime.

Com isso configurado, `git push --tags` numa tag `v*` (ex.: `v1.0.0`) dispara build → contract tests → **pausa esperando aprovação manual do `environment` `production`** → `npm publish` (Trusted Publishing) → GitHub Release.

> **Pacote novo, ainda sem nenhuma versão publicada?** O Trusted Publisher do npm pode ser configurado como "pending" antes do pacote existir — o primeiro `npm publish` via OIDC já cria o pacote, igual ao PyPI/RubyGems.

## Reportando problemas

Abra uma [issue](https://github.com/Twila-Digital/twila-parcelemais-node-sdk/issues) com passos para reproduzir, versão do pacote/Node e o comportamento esperado vs. observado. Nunca inclua `clientId`/`clientSecret` reais no relato.
