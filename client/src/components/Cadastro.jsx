import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Cadastro = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fazerCadastro = async () => {
    try {
      setError(""); // Clear previous errors
      if (!email || !senha || !confirmSenha) {
        setError("Por favor, preencha todos os campos.");
        return;
      }
      if (senha !== confirmSenha) {
        setError("As senhas não coincidem.");
        return;
      }
      if (senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );
      const user = userCredential.user;

      // Save user data to Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        email: email,
        senha: senha, // Storing password (not recommended for production)
        cargo: "usuario",
        createdAt: new Date().toISOString(),
      });

      // Navigate to compra page
      navigate("/compra");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setError(`Erro ao cadastrar: ${error.message}`);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: "#ffc1cc" }}
    >
      <div className="card p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <img
              src="/imgs/Botifalho.png"
              alt="Logo Botifalho"
              style={{ maxWidth: "100px", height: "auto" }}
            />
          </div>
          <h2 className="text-center mb-4">Cadastro</h2>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Senha
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              placeholder="Confirmar Senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-100 mb-3"
            onClick={fazerCadastro}
          >
            Cadastrar
          </button>
          <p className="text-center">
            Já tem conta?{" "}
            <Link to="/" className="text-decoration-none">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
