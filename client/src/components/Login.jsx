import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fazerLogin = async () => {
    try {
      setError(""); // Clear previous errors
      if (!email || !senha) {
        setError("Por favor, preencha todos os campos.");
        return;
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.cargo === "adm") {
          navigate("/home"); // Admins go to /home
        } else {
          navigate("/compra"); // Other users go to /compra
        }
      } else {
        setError("Dados do usuário não encontrados.");
        navigate("/compra"); // Fallback to /compra if no document
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError(`Erro ao fazer login: ${error.message}`);
    }
  };

  const redefinirSenha = async () => {
    if (!email) {
      setError("Por favor, insira seu email para redefinir a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError("");
      alert("Email de redefinição de senha enviado.");
    } catch (error) {
      console.error("Erro ao enviar email de redefinição:", error);
      setError(`Erro ao enviar email de redefinição: ${error.message}`);
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
          <h2 className="text-center mb-4">Login</h2>
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
          <button className="btn btn-primary w-100 mb-3" onClick={fazerLogin}>
            Entrar
          </button>
          <div className="text-center mb-3">
            <button className="btn btn-link p-0" onClick={redefinirSenha}>
              Esqueci minha senha
            </button>
          </div>
          <p className="text-center">
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="text-decoration-none">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
