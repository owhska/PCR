import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const fazerLogin = async () => {
    try {
      // Verificação específica para o admin
      if (email === 'adm@gmail.com' && senha === 'senha123') {
        await signInWithEmailAndPassword(auth, email, senha);
        navigate('/home'); // Redireciona diretamente para /home
        return;
      }

      // Login normal com verificação no Firestore
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Buscar o usuário no Firestore para pegar o role
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === 'admin') {
          navigate('/home'); // Admin vai para Home.jsx
        } else {
          navigate('/compra'); // Usuário normal vai para Compra.jsx
        }
      } else {
        navigate('/compra');
      }
    } catch (error) {
      alert('Erro ao fazer login: ' + error.message);
    }
  };

  const redefinirSenha = async () => {
    if (!email) {
      alert('Por favor, insira seu email para redefinir a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Email de redefinição de senha enviado.');
    } catch (error) {
      alert('Erro ao enviar email de redefinição: ' + error.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#ffc1cc' }}>
      <div className="card p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <img src="/imgs/Botifalho.png" alt="Logo Botifalho" style={{ maxWidth: '100px', height: 'auto' }} />
          </div>
          <h2 className="text-center mb-4">Login</h2>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-100 mb-3" onClick={fazerLogin}>Entrar</button>

          <div className="text-center mb-3">
            <button className="btn btn-link p-0" onClick={redefinirSenha}>
              Esqueci minha senha
            </button>
          </div>

          <p className="text-center">
            Não tem uma conta? <Link to="/cadastro" className="text-decoration-none">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
