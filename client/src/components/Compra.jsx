import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Compra.css';

const Compra = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [search, setSearch] = useState('');
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  const api = axios.create({
    baseURL: 'http://localhost:3000',
  });

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get('/produtos');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos. Verifique o servidor.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
    });
    loadProducts();
    return () => unsubscribe();
  }, [auth, navigate, loadProducts]);

  const handleSearch = (e) => setSearch(e.target.value.toLowerCase());

  const showPurchaseModal = async (id) => {
    try {
      const response = await api.get(`/produtos/${id}`);
      if (response.data && response.data.erro) {
        throw new Error(response.data.erro);
      }
      console.log('Produto selecionado:', response.data);
      setSelectedProduct(response.data);
      setPurchaseQuantity(1);
      setShowCompraModal(true);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert(`Erro ao carregar produto: ${error.message}`);
    }
  };

  const addToCart = () => {
    const quantity = parseInt(purchaseQuantity);
    console.log('Adicionando ao carrinho:', { quantity, available: selectedProduct?.quantidade });
    if (!selectedProduct || isNaN(quantity) || quantity < 1) {
      alert('Quantidade inválida. Por favor, insira um número maior ou igual a 1.');
      return;
    }

    if (quantity > selectedProduct.quantidade) {
      alert('Estoque insuficiente. Escolha uma quantidade menor ou igual ao estoque disponível.');
      return;
    }

    setCart([...cart, { ...selectedProduct, quantity }]);
    setShowCompraModal(false);
    setPurchaseQuantity(1);
  };

  const clearCart = () => {
    setCart([]);
  };

  const viewCart = () => setShowCartModal(true);

  const openPayment = () => {
    setShowCartModal(false);
    setShowPaymentModal(true);
  };

  const finalizePayment = async () => {
    try {
      // Validate payment method
      if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        if (!cardNumber || cardNumber.length < 16) {
          throw new Error('Número do cartão inválido. Deve conter pelo menos 16 dígitos.');
        }
        if (!cardName || cardName.trim() === '') {
          throw new Error('Nome no cartão é obrigatório.');
        }
        if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
          throw new Error('Data de validade inválida. Use o formato MM/AA.');
        }
        if (!cardCVC || cardCVC.length < 3) {
          throw new Error('CVC inválido. Deve conter pelo menos 3 dígitos.');
        }
      } else if (paymentMethod === 'pix') {
        // Simulate Pix validation (e.g., QR code was "scanned")
        console.log('Processando pagamento via Pix com QR code simbólico');
      }

      // Existing stock update logic
      for (const item of cart) {
        const currentProductResponse = await api.get(`/produtos/${item.id}`);
        const currentProduct = currentProductResponse.data;
        console.log('Produto atual:', currentProduct);

        if (!currentProduct) {
          throw new Error(`Produto ${item.id} não encontrado`);
        }

        const newQuantity = currentProduct.quantidade - item.quantity;
        if (newQuantity < 0) {
          throw new Error(`Estoque insuficiente para ${item.nome}`);
        }

        const updatedProduct = {
          nome: currentProduct.nome,
          tipo: currentProduct.tipo,
          preco: currentProduct.preco,
          quantidade: newQuantity,
          situacao: newQuantity <= 0 ? 'Desabilitado' : currentProduct.situacao || 'Disponível',
        };

        console.log(`Atualizando produto ${item.id}:`, updatedProduct);
        await api.put(`/produtos/${item.id}`, updatedProduct);
        console.log(`Produto ${item.id} atualizado com sucesso.`);
      }

      alert(`Pagamento realizado com sucesso via ${paymentMethod === 'credit' ? 'Cartão de Crédito' : paymentMethod === 'debit' ? 'Cartão de Débito' : 'Pix'}!`);
      setCart([]);
      setShowPaymentModal(false);
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCVC('');
      setPaymentMethod('credit');
      loadProducts();
    } catch (error) {
      console.error('Erro ao finalizar pagamento:', error);
      alert(`Erro ao finalizar pagamento: ${error.message}`);
    }
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
          className="search-input"
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
                <p>Preço: R$ {p.preco.toFixed(2)}</p>
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
            <p>Preço: R$ {selectedProduct.preco.toFixed(2)}</p>
            <p>Estoque disponível: {selectedProduct.quantidade}</p>
            <input
              type="number"
              min="1"
              max={selectedProduct.quantidade}
              value={purchaseQuantity}
              onChange={(e) => {
                const value = e.target.value;
                setPurchaseQuantity(value === '' ? '' : parseInt(value) || 1);
              }}
              className="quantity-input"
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
                    <p>{item.nome} - {item.quantity} x R$ {item.preco.toFixed(2)}</p>
                  </div>
                ))}
                <button className="modal-btn" onClick={openPayment}>Ir para Pagamento</button>
                <button className="modal-btn" onClick={clearCart}>Limpar Carrinho</button>
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
              <p key={index}>{item.nome} - {item.quantity} x R$ {item.preco.toFixed(2)}</p>
            ))}
            <div className="payment-method">
              <label>Método de Pagamento:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="payment-select"
              >
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
                <option value="pix">Pix</option>
              </select>
            </div>
            {paymentMethod === 'credit' || paymentMethod === 'debit' ? (
              <div className="card-details">
                <input
                  type="text"
                  placeholder="Número do cartão (ex: 1234 5678 9012 3456)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="card-input"
                />
                <input
                  type="text"
                  placeholder="Nome no cartão"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="card-input"
                />
                <input
                  type="text"
                  placeholder="Validade (MM/AA)"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="card-input"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value)}
                  className="card-input"
                />
              </div>
            ) : (
              <div className="pix-details">
                <p>Escaneie o QR Code abaixo para pagar via Pix:</p>
                <div className="qr-code">QR CODE NAO FUNCIONA. ESPERE NOVAS ATUALIZACOES</div>
              </div>
            )}
            <button className="modal-btn" onClick={finalizePayment}>Finalizar Pagamento</button>
            <button className="modal-btn" onClick={() => setShowPaymentModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compra;
