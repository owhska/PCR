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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      }
    });

    carregarProdutos();
    return () => unsubscribe();
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
        const produtoRef = doc(db, 'produtos', editandoId);
        await updateDoc(produtoRef, {
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
      alert('Erro ao salvar produto: ' + error.message);
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
        senha: adminSenha,
        cargo: 'adm',
        createdAt: new Date().toISOString()
      });

      limparAdminFormulario();
      setShowAdminModal(false);
      alert('Administrador cadastrado com sucesso!');
    } catch (error) {
      setAdminError('Erro ao cadastrar administrador: ' + error.message);
    }
  };

  const editarProduto = (produto) => {
    setNome(produto.nome);
    setPreco(produto.preco);
    setQuantidade(produto.quantidade);
    setSituacao(produto.situacao);
    setTipo(produto.tipo);
    setEditandoId(produto.id);
    setShowModal(true);
  };

  const excluirProduto = async (id) => {
    if (window.confirm('Deseja realmente excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', id));
        carregarProdutos();
      } catch (error) {
        alert('Erro ao excluir produto: ' + error.message);
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
        <button className="btn btn-danger me-2" onClick={logout}>Logout</button>
        <button className="btn btn-success" onClick={() => { limparAdminFormulario(); setShowAdminModal(true); }}>
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

      <button className="btn btn-primary mb-3" onClick={() => { limparFormulario(); setShowModal(true); }}>
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
          {filteredProdutos.map(prod => (
            <tr key={prod.id}>
              <td>{prod.nome}</td>
              <td>{prod.preco.toFixed(2)}</td>
              <td>{prod.quantidade}</td>
              <td>{prod.situacao}</td>
              <td>{prod.tipo}</td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => editarProduto(prod)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => excluirProduto(prod.id)}>Excluir</button>
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
              <input className="form-control mb-2" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" />
              <input className="form-control mb-2" type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço" />
              <input className="form-control mb-2" type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Quantidade" />
              <select className="form-control mb-2" value={situacao} onChange={e => setSituacao(e.target.value)}>
                <option value="Habilitado">Habilitado</option>
                <option value="Desabilitado">Desabilitado</option>
              </select>
              <input className="form-control mb-2" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Tipo" />
              <button className="btn btn-primary me-2" type="submit">{editandoId ? 'Atualizar' : 'Salvar'}</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className.includes('modal-overlay') && setShowAdminModal(false)}>
          <div className="modal-content">
            <h5>Cadastrar Administrador</h5>
            <form onSubmit={cadastrarAdmin}>
              {adminError && <div className="alert alert-danger">{adminError}</div>}
              <input className="form-control mb-2" type="email" placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              <input className="form-control mb-2" type="password" placeholder="Senha" value={adminSenha} onChange={(e) => setAdminSenha(e.target.value)} />
              <input className="form-control mb-2" type="password" placeholder="Confirmar Senha" value={adminConfirmSenha} onChange={(e) => setAdminConfirmSenha(e.target.value)} />
              <button className="btn btn-primary me-2" type="submit">Cadastrar</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowAdminModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
