# Contribuindo

## Pré-requisitos

- Node.js 22.12+ para rodar a suíte de testes (vitest 5 exige isso — ver abaixo)
- npm 9+

## Build e testes

```bash
npm install
npm run build
npm test
```

O vitest 5 **não roda em Node 14/18** (exige `^22.12.0 || ^24.0.0 || >=26.0.0`) — a suíte completa só faz sentido em Node 22+. Para validar o piso legado (Node 14) que o pacote publicado promete suportar, rode o smoke test sem framework contra o build real:

```bash
npm run build
node scripts/smoke-legacy.cjs
node scripts/smoke-legacy.mjs
```

Troque o Node ativo (nvm, volta, etc.) para 14 ou 18 antes de rodar os dois comandos acima — essa é a validação que realmente importa pro piso mínimo, já que o vitest não consegue fazer isso por si (ver `SDK-PLAYBOOK.md` §2.4 no repositório `sdks-twila`, a mesma lição do "multi-target os testes" do SDK .NET/Java, adaptada aqui porque a própria ferramenta de teste tem um piso mais alto que o pacote).

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
