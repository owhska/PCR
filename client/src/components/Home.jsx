import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [situacao, setSituacao] = useState('Habilitado');
  const [tipo, setTipo] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const [searchNome, setSearchNome] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminConfirmSenha, setAdminConfirmSenha] = useState('');
  const [adminError, setAdminError] = useState('');

  const api = axios.create({
    baseURL: 'http://localhost:3000',
  });

  const carregarProdutos = useCallback(async () => {
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos. Verifique o servidor.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarProdutos();
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, carregarProdutos]);

  const limparFormulario = () => {
    setNome('');
    setPreco('');
    setQuantidade('');
    setSituacao('Habilitado');
    setTipo('');
    setEditandoId(null);
  };

  const limparAdminFormulario = () => {
    setAdminEmail('');
    setAdminSenha('');
    setAdminConfirmSenha('');
    setAdminError('');
  };

  const salvarProduto = async (e) => {
    e.preventDefault();

    if (!nome || !preco || !quantidade || !tipo) {
      alert('Preencha todos os campos obrigatórios (Nome, Preço, Quantidade, Tipo)!');
      return;
    }

    const parsedPreco = parseFloat(preco);
    const parsedQuantidade = parseInt(quantidade);

    if (isNaN(parsedPreco) || parsedPreco <= 0) {
      alert('Preço deve ser um número positivo.');
      return;
    }

    if (isNaN(parsedQuantidade) || parsedQuantidade < 0) {
      alert('Quantidade deve ser um número não-negativo.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Usuário não autenticado. Faça login novamente.');
        navigate('/');
        return;
      }

      const produtoData = {
        nome,
        preco: parsedPreco,
        quantidade: parsedQuantidade,
        situacao,
        tipo,
        usuario: user.email, // Inclui o email do usuário autenticado
      };

      console.log('Enviando produto:', produtoData);

      if (editandoId) {
        await api.put(`/produtos/${editandoId}`, produtoData);
        alert('Produto atualizado com sucesso!');
      } else {
        await api.post('/produtos', produtoData);
        alert('Produto cadastrado com sucesso!');
      }

      limparFormulario();
      carregarProdutos();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      const errorMessage = error.response?.data?.erro || error.message;
      alert(`Erro ao salvar produto: ${errorMessage}`);
    }
  };

  const cadastrarAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!adminEmail || !adminSenha || !adminConfirmSenha) {
      setAdminError('Por favor, preencha todos os campos.');
      return;
    }

    if (adminSenha !== adminConfirmSenha) {
      setAdminError('As senhas não coincidem.');
      return;
    }

    if (adminSenha.length < 6) {
      setAdminError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminSenha);
      const user = userCredential.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        email: adminEmail,
        senha: adminSenha, // Nota: Armazenar senhas em texto puro não é recomendado
        cargo: 'adm',
        createdAt: new Date().toISOString(),
      });

      limparAdminFormulario();
      setShowAdminModal(false);
      alert('Administrador cadastrado com sucesso!');
    } catch (error) {
      setAdminError('Erro ao cadastrar administrador: ' + error.message);
    }
  };

  const editarProduto = async (id) => {
    try {
      const response = await api.get(`/produtos/${id}`);
      const produto = response.data;
      setNome(produto.nome);
      setPreco(produto.preco.toString());
      setQuantidade(produto.quantidade.toString());
      setSituacao(produto.situacao);
      setTipo(produto.tipo);
      setEditandoId(id);
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert(`Erro ao carregar produto: ${error.message}`);
    }
  };

  const excluirProduto = async (id) => {
    if (window.confirm('Deseja realmente excluir este produto?')) {
      try {
        await api.delete(`/produtos/${id}`);
        carregarProdutos();
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert(`Erro ao excluir produto: ${error.message}`);
      }
    }
  };

  const logout = () => {
    signOut(auth);
    navigate('/');
  };

  const filteredProdutos = produtos.filter((produto) => {
    const nomeMatch = produto.nome.toLowerCase().includes(searchNome.toLowerCase());
    const precoMatch =
      (!minPrice || produto.preco >= parseFloat(minPrice)) &&
      (!maxPrice || produto.preco <= parseFloat(maxPrice));
    const situacaoMatch = !searchSituacao || produto.situacao === searchSituacao;

    return nomeMatch && precoMatch && situacaoMatch;
  });

  return (
    <div className="container" style={{ backgroundColor: '#F5DADF' }}>
      <div className="text-center mb-4">
        <img src="/imgs/Botifalho.png" alt="Logo Botifalho" style={{ maxWidth: '100px' }} />
      </div>

      <div className="mb-3">
        <button className="btn btn-danger me-2" onClick={logout}>
          Logout
        </button>
        <button
          className="btn btn-success"
          onClick={() => {
            limparAdminFormulario();
            setShowAdminModal(true);
          }}
        >
          Cadastrar Admin
        </button>
      </div>

      <div className="card p-3 mb-4">
        <h5>Filtros</h5>
        <div className="row g-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nome"
              value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="Preço Mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="Preço Máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-control"
              value={searchSituacao}
              onChange={(e) => setSearchSituacao(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Habilitado">Habilitado</option>
              <option value="Desabilitado">Desabilitado</option>
            </select>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          limparFormulario();
          setShowModal(true);
        }}
      >
        Adicionar Produto
      </button>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço</th>
            <th>Quantidade</th>
            <th>Situação</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredProdutos.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.nome}</td>
              <td>{prod.preco.toFixed(2)}</td>
              <td>{prod.quantidade}</td>
              <td>{prod.situacao}</td>
              <td>{prod.tipo}</td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => editarProduto(prod.id)}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => excluirProduto(prod.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Produto */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className.includes('modal-overlay') && setShowModal(false)}>
          <div className="modal-content">
            <h5>{editandoId ? 'Editar Produto' : 'Adicionar Produto'}</h5>
            <form onSubmit={salvarProduto}>
              <input
                className="form-control mb-2"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome"
              />
              <input
                className="form-control mb-2"
                type="number"
                step="0.01"
                min="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Preço"
              />
              <input
                className="form-control mb-2"
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Quantidade"
              />
              <select
                className="form-control mb-2"
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
              >
                <option value="Habilitado">Habilitado</option>
                <option value="Desabilitado">Desabilitado</option>
              </select>
              <input
                className="form-control mb-2"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Tipo"
              />
              <button className="btn btn-primary me-2" type="submit">
                {editandoId ? 'Atualizar' : 'Salvar'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin */}
      {showAdminModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target.className.includes('modal-overlay') && setShowAdminModal(false)}
        >
          <div className="modal-content">
            <h5>Cadastrar Administrador</h5>
            <form onSubmit={cadastrarAdmin}>
              {adminError && <div className="alert alert-danger">{adminError}</div>}
              <input
                className="form-control mb-2"
                type="email"
                placeholder="Email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <input
                className="form-control mb-2"
                type="password"
                placeholder="Senha"
                value={adminSenha}
                onChange={(e) => setAdminSenha(e.target.value)}
              />
              <input
                className="form-control mb-2"
                type="password"
                placeholder="Confirmar Senha"
                value={adminConfirmSenha}
                onChange={(e) => setAdminConfirmSenha(e.target.value)}
              />
              <button className="btn btn-primary me-2" type="submit">
                Cadastrar
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowAdminModal(false)}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;