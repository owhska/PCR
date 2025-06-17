# 🧴 Sistema de Loja de Cosméticos

## 📌 Visão Geral

Este projeto é um sistema completo para gerenciamento de uma loja de cosméticos, oferecendo funcionalidades tanto para clientes quanto para administradores. A aplicação é dividida em duas áreas principais:

- **Área de Vendas (Usuário comum):**
  - Cadastro e login de usuários
  - Autenticação com Firebase
  - Acesso ao catálogo de produtos
  - Visualização de informações e venda dos produtos

- **Área Administrativa (Admin):**
  - Login restrito
  - CRUD completo de produtos (criar, editar, excluir e visualizar)
  - Gerenciamento de estoque

---

## 🧱 Estrutura do Projeto

```
PCR/
├── client/
│   ├── public/imgs/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── services/
│   │   │   ├── firebase.js         # Configuração do Firebase (não versionado)
│   │   │   ├── firebaseConfig.js   # Chaves e inicialização do Firebase (não versionado)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── firebaseKey.json            # Chave privada do Firebase (não versionado)
│   ├── index.js
│   ├── firebase.json
│   ├── .firebaserc
│   └── package.json
```

---

## 🔐 Autenticação e Autorização

- Utiliza **Firebase Authentication**.
- Usuários comuns podem se cadastrar e acessar a área de vendas.
- Administradores têm acesso ao painel de controle com gerenciamento de estoque.
- O tipo de usuário é verificado através de dados armazenados no **Firestore**.

---

## 🗂️ Banco de Dados

- Utiliza o **Firebase Firestore** como banco de dados em nuvem.
- Estrutura básica esperada:

```
usuários/
  └── {userId}
      ├── email
      └── cargo: "adm" | "user"

produtos/
  └── {productId}
      ├── nome
      ├── situacao
      ├── preço
      ├── quantidade
      ├── usuario
      └── tipo
```

---

## 🔧 Serviços Firebase

- `firebase.js`: Inicializa e exporta instâncias do Firebase.
- `firebaseConfig.js`: Contém as credenciais e configurações do Firebase.
- `firebaseKey.json`: Chave privada para uso backend com Firebase Admin SDK.

⚠️ **Esses arquivos são sensíveis e não devem ser commitados.**  
Certifique-se de adicioná-los ao `.gitignore`.

---

## ⚙️ Tecnologias Utilizadas

- **Frontend:** React + Vite
- **Estilização:** CSS e Bootstrap
- **Backend:** Node.js (em `server/index.js`)
- **Banco de dados:** Firebase Firestore
- **Autenticação:** Firebase Auth

---

## 🚀 Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/owhska/PCR
```

### 2. Instale as dependências

#### Client

```bash
cd client
npm install
```

#### Server

```bash
cd ../server
npm install
```

### 3. Crie os arquivos sensíveis manualmente

Esses arquivos **não estão no repositório**, mas são essenciais:

- `client/src/services/firebase.js`
- `client/src/services/firebaseConfig.js`
- `server/firebaseKey.json`

Preencha com os dados fornecidos no console do Firebase.

### 4. Execute o projeto

#### Frontend

```bash
cd client
npm run dev
```

#### Backend

```bash
cd server
node index.js
```

---

## 🧪 Funcionalidades Futuras

- Upload de imagem para produtos
- Gráficos de relatórios (admin)
- Integração com o pix

---

## 🛡️ Segurança

- Os arquivos `firebaseKey.json`, `firebase.js` e `firebaseConfig.js` **NÃO devem ser versionados.**
- Certifique-se de que estão incluídos no `.gitignore`.

---