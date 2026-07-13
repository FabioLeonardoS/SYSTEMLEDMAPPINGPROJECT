# Deployment em VPS (Docker)

O sistema foi preparado com um `Dockerfile` multi-stage otimizado e um `docker-compose.yml` para facilitar a hospedagem em qualquer VPS (Ubuntu, Debian, etc.).

## Pré-requisitos
1. Ter o Docker e Docker Compose instalados no servidor.
2. Acesso SSH à VPS.

## Instalação

1. Clone o repositório ou copie os arquivos para a VPS:
```bash
git clone https://seu-repositorio/led-mapping.git
cd led-mapping
```

2. (Opcional) Configure Variáveis de Ambiente.
Se houver alguma variável de ambiente (como chaves de API restritas no futuro), crie um arquivo `.env` na raiz do projeto. Por padrão, a aplicação acessa a planilha do Google de forma pública, não requerendo chaves no momento.
Exemplo de `.env`:
```
NODE_ENV=production
```

3. Suba o container:
```bash
docker compose up -d --build
```

O Next.js irá baixar as dependências, buildar o projeto localmente dentro do container multi-stage e iniciar a aplicação.

## Acesso
A aplicação estará disponível na porta `3000`. 
Recomendamos o uso do **Nginx** como proxy reverso para servir a aplicação na porta `80/443` com certificado SSL (Certbot/Let's Encrypt), permitindo que o Service Worker do PWA funcione corretamente (PWA exige HTTPS).

## Atualização

Sempre que houver mudanças de código, puxe-as via git e recrie a imagem:
```bash
git pull
docker-compose up -d --build
```
