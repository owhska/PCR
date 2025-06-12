import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // URL do seu backend
});

export const getProdutos = async () => {
  const response = await api.get('/produtos');
  return response.data;
};

export const addProduto = async (produto) => {
  const response = await api.post('/produtos', produto);
  return response.data;
};

export const deleteProduto = async (id) => {
  await api.delete(`/produtos/${id}`);
};

export const updateProduto = async (id, produto) => {
  await api.put(`/produtos/${id}`, produto);
};