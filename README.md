# BRECHÓ NICE - Projeto Completo (Full-Stack Node.js + SQLite)

Esta versão foi estruturada diretamente na raiz do projeto para evitar erros de diretório no terminal.

## 📁 Estrutura de Arquivos

```
brecho_nice_pronto/
├── app.js               # Backend Node.js / Express
├── package.json         # Arquivo de dependências
├── README.md            # Instruções de instalação
├── database.sqlite      # Gerado automaticamente na primeira execução
├── uploads/             # Pasta onde ficam salvas as fotos cadastradas no admin
└── public/
    ├── index.html       # Interface HTML5 / Tailwind / JavaScript
    └── images/          # Foto da Nice, imagem do brechó e logo
```

## 🚀 Passo a Passo Exato para Rodar sem Erros

1. **Extraia o ZIP**: Extraia o conteúdo deste `.zip` diretamente para uma pasta (ex: `C:\Users\Carol\Desktop\brecho_nice_pronto`).
2. **Abra a pasta no VS Code**:
   - No VS Code, vá em `File > Open Folder...` e selecione a pasta `brecho_nice_pronto`.
   - Abra o terminal do VS Code (`Ctrl + '`).
3. **Instale as dependências**:
   ```bash
   npm install
   ```
4. **Inicie o servidor**:
   ```bash
   node app.js
   ```
5. **Acesse no seu navegador**:
   Abra `http://localhost:3000`

## 📸 Como adicionar suas imagens
As imagens do Brechó Nice ficam na pasta `public/images/`:
- **Foto da Nice:** `foto da nice.jpg`
- **Imagem do brechó:** `Imagem do brecho.jpg`
- **Logo:** `logo.jpg`

## 🔑 Acesso ao Painel Adm
- **Usuário:** `admin`
- **Senha:** `admin123`
