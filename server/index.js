const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const app = express();
const PORT = 3000;

const serviceAccount = require("./firebaseKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(cors());
app.use(express.json());

// Rota GET - lista todos os produtos
app.get("/produtos", async (req, res) => {
  try {
    const snapshot = await db.collection("produtos").get();
    const produtos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

// Rota GET - busca um produto pelo ID
app.get("/produtos/:id", async (req, res) => {
  try {
    const docRef = db.collection("produtos").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    const data = docSnap.data();
    if (typeof data.quantidade !== "number" || data.quantidade < 0) {
      console.error(
        `Quantidade inválida para produto ${docSnap.id}:`,
        data.quantidade
      );
      return res.status(400).json({ erro: "Quantidade do produto é inválida" });
    }
    res.status(200).json({ id: docSnap.id, ...data });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});

// Rota POST - adiciona um novo produto
app.post("/produtos", async (req, res) => {
  try {
    const { nome, tipo, preco, quantidade, situacao, usuario } = req.body;

    if (!nome || !tipo || !preco || !quantidade || !situacao || !usuario) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }
    if (typeof quantidade !== "number" || quantidade < 0) {
      return res
        .status(400)
        .json({ erro: "Quantidade deve ser um número não-negativo" });
    }
    if (!["Habilitado", "Desabilitado"].includes(situacao)) {
      return res
        .status(400)
        .json({ erro: "Situação deve ser 'Habilitado' ou 'Desabilitado'" });
    }

    const docRef = await db.collection("produtos").add({
      nome,
      tipo,
      preco,
      quantidade,
      situacao,
      usuario,
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    res.status(500).json({ erro: "Erro ao adicionar produto" });
  }
});

// Rota DELETE - remove um produto pelo ID
app.delete("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("produtos").doc(id).delete();
    res.status(200).json({ mensagem: "Produto excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).json({ erro: "Erro ao excluir produto" });
  }
});

// Rota PUT - atualiza um produto pelo ID
app.put("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, preco, quantidade, situacao } = req.body;

    // Validar apenas os campos fornecidos
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (tipo) updateData.tipo = tipo;
    if (preco !== undefined) updateData.preco = preco;
    if (quantidade !== undefined) {
      if (typeof quantidade !== "number" || quantidade < 0) {
        return res
          .status(400)
          .json({ erro: "Quantidade deve ser um número não-negativo" });
      }
      updateData.quantidade = quantidade;
    }
    if (situacao) {
      if (!["Habilitado", "Desabilitado"].includes(situacao)) {
        return res
          .status(400)
          .json({ erro: "Situação deve ser 'Habilitado' ou 'Desabilitado'" });
      }
      updateData.situacao = situacao;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ erro: "Nenhum campo válido fornecido para atualização" });
    }

    console.log(`Atualizando produto ${id} com dados:`, updateData);
    await db.collection("produtos").doc(id).update(updateData);
    console.log(`Produto ${id} atualizado com sucesso`);
    res.status(200).json({ mensagem: "Produto atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}/produtos`);
});
