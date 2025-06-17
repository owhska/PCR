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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false); // Estado
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

  const handleShowPurchaseModal = async (id) => { // Renomeado de showPurchaseModal para handleShowPurchaseModal
    try {
      const response = await api.get(`/produtos/${id}`);
      if (response.data && response.data.erro) {
        throw new Error(response.data.erro);
      }
      console.log('Produto selecionado:', response.data);
      setSelectedProduct(response.data);
      setPurchaseQuantity(1);
      setShowPurchaseModal(true); // Usando o estado
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
    setShowPurchaseModal(false); // Usando o estado
    setPurchaseQuantity(1);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
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

      alert(`Pagamento realizado com sucesso via ${paymentMethod === 'credit' ? 'Cartão de Crédito' : paymentMethod === 'debit' ? 'Cartão de Débito' : 'Pix'}! Venha buscar o produto na loja!`);
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
    signOut(auth).then(() => {
      navigate('/');
    }).catch((error) => {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    });
  };

  // Função para calcular o valor total do carrinho
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.preco * item.quantity, 0).toFixed(2);
  };


  const productImages = {
    Perfume: 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    Perfumes: 'https://images.unsplash.com/photo-1514348871858-1d3c20902571?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Cremes e Hidratantes': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    Maquiagem: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    'Produtos pra Cabelo': 'https://images.unsplash.com/photo-1601070846144-6be3aad73f7b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHV0b3MlMjBkZSUyMGNhYmVsb3xlbnwwfHwwfHx8MA%3D%3D', 
    Outros: 'https://sqquimica.com/wp-content/uploads/2023/07/Tendencias-em-espessantes-para-cosmeticos.png',
  };

  
  const getProductImage = (tipo) => {
    if (!tipo) return productImages['Outros'];
    const normalizedTipo = tipo.toLowerCase();
    const typeMap = {
      perfume: 'Perfume',
      perfumes: 'Perfumes',
      'cremes e hidratantes': 'Cremes e Hidratantes',
      maquiagem: 'Maquiagem',
      'produtos pra cabelo': 'Produtos pra Cabelo', // Novo mapeamento
      outros: 'Outros',
    };
    const mappedType = typeMap[normalizedTipo] || 'Outros';
    return productImages[mappedType] || productImages['Outros'];
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
              <img src={getProductImage(p.tipo)} className="product-img" alt={p.nome} />
              <div className="product-info">
                <h5>{p.nome}</h5>
                <p>Preço: R$ {p.preco.toFixed(2)}</p>
                <p>Estoque: {p.quantidade}</p>
                <button className="buy-btn" onClick={() => handleShowPurchaseModal(p.id)}>Comprar</button> {/* Atualizado para handleShowPurchaseModal */}
              </div>
            </div>
          ))}
      </div>

      <div className="cart-float" onClick={viewCart}>
        <span>Finalizar Compra</span>
        <div className="cart-count">{cart.length}</div>
      </div>

      {showPurchaseModal && selectedProduct && ( // Usando o estado
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
            <button className="modal-btn" onClick={() => setShowPurchaseModal(false)}>Fechar</button> {/* Usando o estado */}
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
                  <div key={index} className="cart-item">
                    <p>{item.nome} - {item.quantity} x R$ {item.preco.toFixed(2)}</p>
                    <button className="remove-btn" onClick={() => removeFromCart(index)}>Remover</button>
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
            <p><strong>Valor Total: R$ {calculateTotal()}</strong></p>
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
                  placeholder="Número do cartão (ex: 1234 5678 9013 3456)"
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