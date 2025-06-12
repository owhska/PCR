import { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Compra.css';

const Compra = () => {
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  const [products, setProdutos] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [search, setSearch] = useState('');
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
    });
    loadProducts();
  }, [auth, navigate]);

  const loadProducts = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'produtos'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProdutos(list);
  }, [db]);

  const handleSearch = (e) => setSearch(e.target.value.toLowerCase());

  const showPurchaseModal = async (id) => {
    const docRef = doc(db, 'produtos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setSelectedProduct({ id: docSnap.id, ...docSnap.data() });
      setShowCompraModal(true);
    }
  };

  const addToCart = async () => {
    const quantity = parseInt(purchaseQuantity);
    if (!selectedProduct || isNaN(quantity) || quantity < 1) return;

    if (quantity > selectedProduct.quantidade) {
      alert('Estoque insuficiente.');
      return;
    }

    setCart([...cart, { ...selectedProduct, quantity }]);
    setShowCompraModal(false);
    setPurchaseQuantity(1);
  };

  const viewCart = () => setShowCartModal(true);
  const openPayment = () => {
    setShowCartModal(false);
    setShowPaymentModal(true);
  };
  const finalizePayment = async () => {
    for (const item of cart) {
      const ref = doc(db, 'produtos', item.id);
      await updateDoc(ref, { quantidade: increment(-item.quantity) });

      const docSnap = await getDoc(ref);
      if (docSnap.exists() && docSnap.data().quantidade <= 0) {
        await deleteDoc(ref);
      }
    }
    alert('Pagamento realizado!');
    setCart([]);
    setShowPaymentModal(false);
    loadProducts();
  };

  const logout = () => {
    signOut(auth);
    navigate('/');
  };

  return (
    <div className="compra-container">
      <h2 className="text-center">
        <img src="/imgs/Botifalho.png" alt="Logo" className="logo-img" />
      </h2>

      <div className="filters">
        <h3>Filtrar Produtos</h3>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={search}
          onChange={handleSearch}
        />
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      <div className="product-grid">
        {products
          .filter(p => p.nome.toLowerCase().includes(search) && p.situacao !== 'Desabilitado')
          .map(p => (
            <div key={p.id} className="product-card">
              <img src="https://sqquimica.com/wp-content/uploads/2023/07/Tendencias-em-espessantes-para-cosmeticos.png" className="product-img" alt={p.nome} />
              <div className="product-info">
                <h5>{p.nome}</h5>
                <p>Preço: R$ {p.preco}</p>
                <p>Estoque: {p.quantidade}</p>
                <button className="buy-btn" onClick={() => showPurchaseModal(p.id)}>Comprar</button>
              </div>
            </div>
          ))}
      </div>

      <div className="cart-float" onClick={viewCart}>
        <span>Finalizar Compra</span>
        <div className="cart-count">{cart.length}</div>
      </div>

      {showCompraModal && selectedProduct && (
        <div className="modal">
          <div className="modal-content">
            <h3>Comprar {selectedProduct.nome}</h3>
            <p>Preço: R$ {selectedProduct.preco}</p>
            <p>Estoque disponível: {selectedProduct.quantidade}</p>
            <input
              type="number"
              min="1"
              value={purchaseQuantity}
              onChange={(e) => setPurchaseQuantity(e.target.value)}
            />
            <button className="modal-btn" onClick={addToCart}>Adicionar ao Carrinho</button>
            <button className="modal-btn" onClick={() => setShowCompraModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Carrinho</h3>
            {cart.length === 0 ? (
              <p>Carrinho vazio</p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div key={index}>
                    <p>{item.nome} - {item.quantity} x R$ {item.preco}</p>
                  </div>
                ))}
                <button className="modal-btn" onClick={openPayment}>Ir para Pagamento</button>
              </>
            )}
            <button className="modal-btn" onClick={() => setShowCartModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Pagamento</h3>
            <p>Resumo do pedido:</p>
            {cart.map((item, index) => (
              <p key={index}>{item.nome} - {item.quantity} x R$ {item.preco}</p>
            ))}
            <button className="modal-btn" onClick={finalizePayment}>Finalizar Pagamento</button>
            <button className="modal-btn" onClick={() => setShowPaymentModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compra;