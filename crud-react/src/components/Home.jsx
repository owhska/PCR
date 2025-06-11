import React, { useEffect, useState } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
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

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
    });
    carregarProdutos();
  }, [navigate]);

  const carregarProdutos = async () => {
    const snapshot = await getDocs(collection(db, 'produtos'));
    const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProdutos(lista);
  };

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
      alert('Preencha todos os campos!');
      return;
    }

    try {
      if (editandoId) {
        const ref = doc(db, 'produtos', editandoId);
        await updateDoc(ref, {
          nome,
          preco: parseFloat(preco),
          quantidade: parseInt(quantidade),
          situacao,
          tipo
        });
      } else {
        await addDoc(collection(db, 'produtos'), {
          nome,
          preco: parseFloat(preco),
          quantidade: parseInt(quantidade),
          situacao,
          tipo
        });
      }
      limparFormulario();
      carregarProdutos();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`Erro ao salvar produto: ${error.message}`);
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
      setAdminError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminSenha);
      const user = userCredential.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        email: adminEmail,
        senha: adminSenha,
        cargo: 'adm',
        createdAt: new Date().toISOString()
      });

      limparAdminFormulario();
      setShowAdminModal(false);
      alert('Administrador cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar admin:', error);
      setAdminError(`Erro ao cadastrar: ${error.message}`);
    }
  };

  const editarProduto = (produto) => {
    setNome(produto.nome);
    setPreco(produto.preco);
    setQuantidade(produto.quantidade);
    setSituacao(produto.situacao || 'Habilitado');
    setTipo(produto.tipo || '');
    setEditandoId(produto.id);
    setShowModal(true);
  };

  const excluirProduto = async (id) => {
    if (window.confirm('Deseja realmente excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', id));
        carregarProdutos();
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

  const filteredProdutos = produtos.filter(produto => {
    const matchesNome = produto.nome.toLowerCase().includes(searchNome.toLowerCase());
    const matchesPreco = (!minPrice || produto.preco >= parseFloat(minPrice)) &&
                        (!maxPrice || produto.preco <= parseFloat(maxPrice));
    const matchesSituacao = !searchSituacao || produto.situacao === searchSituacao;
    return matchesNome && matchesPreco && matchesSituacao;
  });

  const handleCloseModal = (e) => {
    if (e.target.className.includes('modal-overlay')) {
      setShowModal(false);
      limparFormulario();
    }
  };

  const handleCloseAdminModal = (e) => {
    if (e.target.className.includes('modal-overlay')) {
      setShowAdminModal(false);
      limparAdminFormulario();
    }
  };

  return (
    <div className="container" style={{ backgroundColor: '#F5DADF' }}>
      <div className="text-center mb-4">
        <img src="/imgs/Botifalho.png" alt="Logo Botifalho" style={{ maxWidth: '100px', height: 'auto' }} />
      </div>

      <button className="btn btn-danger mb-3" onClick={logout}>Logout</button>
      <button className="btn btn-success mb-3 ms-2" onClick={() => { limparAdminFormulario(); setShowAdminModal(true); }}>
        Cadastrar Admin
      </button>

      <div className="row">
        <div className="col-12">
          <div className="mb-4">
            <h3>Filtros</h3>
            <div className="row g-3">
              <div className="col-md-4">
                <label>Nome</label>
                <input
                  type="text"
                  className="form-control"
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                  placeholder="Pesquisar por nome..."
                />
              </div>
              <div className="col-md-4">
                <label>Preço Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Mínimo..."
                />
              </div>
              <div className="col-md-4">
                <label>Preço Máximo</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Máximo..."
                />
              </div>
              <div className="col-md-4 mt-3">
                <label>Situação</label>
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

          <button className="btn btn-primary mb-3" onClick={() => { limparFormulario(); setShowModal(true); }}>
            Adicionar Produto
          </button>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço (R$)</th>
                <th>Quantidade</th>
                <th>Situação</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map(produto => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.preco.toFixed(2)}</td>
                  <td>{produto.quantidade}</td>
                  <td>{produto.situacao || 'Habilitado'}</td>
                  <td>{produto.tipo || '-'}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => editarProduto(produto)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => excluirProduto(produto.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Produto */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editandoId ? 'Editar Produto' : 'Adicionar Produto'}</h5>
              <button type="button" className="close" onClick={() => { setShowModal(false); limparFormulario(); }}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={salvarProduto}>
                <div className="mb-3">
                  <label>Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label>Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label>Situação</label>
                  <select
                    className="form-control"
                    value={situacao}
                    onChange={(e) => setSituacao(e.target.value)}
                  >
                    <option value="Habilitado">Habilitado</option>
                    <option value="Desabilitado">Desabilitado</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label>Tipo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    placeholder="Ex: Perfume, Maquiagem"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {editandoId ? 'Atualizar' : 'Adicionar'}
                </button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => { setShowModal(false); limparFormulario(); }}>
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Cadastrar Admin */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={handleCloseAdminModal}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Cadastrar Administrador</h5>
              <button type="button" className="close" onClick={() => { setShowAdminModal(false); limparAdminFormulario(); }}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={cadastrarAdmin}>
                {adminError && <div className="alert alert-danger" role="alert">{adminError}</div>}
                <div className="mb-3">
                  <label htmlFor="adminEmail" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="adminEmail"
                    placeholder="Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="adminSenha" className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    id="adminSenha"
                    placeholder="Senha"
                    value={adminSenha}
                    onChange={(e) => setAdminSenha(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="adminConfirmSenha" className="form-label">Confirmar Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    id="adminConfirmSenha"
                    placeholder="Confirmar Senha"
                    value={adminConfirmSenha}
                    onChange={(e) => setAdminConfirmSenha(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Cadastrar</button>
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => { setShowAdminModal(false); limparAdminFormulario(); }}
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;