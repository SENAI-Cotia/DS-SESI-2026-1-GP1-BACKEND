import express, { Request, Response } from "express";
import crypto from "crypto";
import prisma from "./lib/prisma";
const app = express();
app.use(express.json());

const excludePassword = (user: any) => {
  if (!user) return null;
  const { senha, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const hashPassword = (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
};

const verifyPassword = (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

app.post('/administradores', async (req, res) => {
  try {
    const { nome, email, senha, id_filial } = req.body;
    const hashedPassword = await hashPassword(senha);
    
    const admin = await prisma.administrador.create({
      data: { nome, email, senha: hashedPassword, id_filial: Number(id_filial) }
    });
    
    res.status(201).json(excludePassword(admin));
  } catch (err) {
    res.status(400).json({ error: "Erro ao criar administrador. Verifique se o e-mail já existe." });
  }
});

app.get('/administradores', async (req: Request, res: Response) => {
  const admins = await prisma.administrador.findMany();
  res.status(200).json(admins.map(excludePassword));
});

app.patch('/administradores/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.id_filial) data.id_filial = Number(data.id_filial);
    if (data.senha) data.senha = await hashPassword(data.senha);

    const admin = await prisma.administrador.update({
      where: { id_usuario: Number(id) },
      data
    });
    
    res.status(200).json(excludePassword(admin));
  } catch (err) {
    res.status(404).json({ error: "Administrador não encontrado." });
  }
});

app.delete('/administradores/:id', async (req: Request, res: Response) => {
  try {
    await prisma.administrador.delete({
      where: { id_usuario: Number(req.params.id) }
    });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: "Administrador não encontrado." });
  }
});

app.post('/gerentes', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, id_filial } = req.body;
    const hashedPassword = await hashPassword(senha);
    
    const gerente = await prisma.gerente.create({
      data: { nome, email, senha: hashedPassword, id_filial: Number(id_filial) }
    });
    
    res.status(201).json(excludePassword(gerente));
  } catch (err) {
    res.status(400).json({ error: "Erro ao criar gerente." });
  }
});

app.get('/gerentes', async (req: Request, res: Response) => {
  const gerentes = await prisma.gerente.findMany();
  res.status(200).json(gerentes.map(excludePassword));
});


app.patch('/gerentes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.id_filial) data.id_filial = Number(data.id_filial);
    
    const gerente = await prisma.gerente.update({
      where: { id_usuario: Number(id) },
      data
    });
    
    res.status(200).json(excludePassword(gerente));
  } catch (err) {
    res.status(404).json({ error: "Gerente não encontrado." });
  }
});

app.delete('/gerentes/:id', async (req: Request, res: Response) => {
  try {
    await prisma.gerente.delete({
      where: { id_usuario: Number(req.params.id) }
    });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: "Gerente não encontrado." });
  }
});



//buscar pedido por id

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// 1.EasyStock
interface Produto {
  id: number;
  nome: string;
  categoria: string;
  codigoProduto: string; // SKU ou EAN
  quantidade: number;
  preco: number;
  palavraChave: string[]; // Array de strings para facilitar buscas
  emEstoque: boolean;
  imagem: string; //imagem
}


const bancoDados: Produto[] = [  
  {
    id: 101,
    nome: "Monitor UltraWide 29'",
    categoria: "Eletrônicos",
    codigoProduto: "EST-MON-001",
    quantidade: 8,
    preco: 1250.00,
    palavraChave: ["monitor", "lg", "ultrawide", "escritorio"],
    emEstoque: true,
    imagem: "https://estoque.easystock.com.br/fotos/monitor29.png"
  }
];

app.get("/bancoDados/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ 
      empresa: "EasyStock", 
      erro: "O parâmetro ID deve ser um número." 
    });
  }

  const produto = bancoDados.find((item: Produto) => item.id === id);

  if (produto) {
    return res.json({
      empresa: "EasyStock",
      data: produto
    });
  }

  return res.status(404).json({
    empresa: "EasyStock",
    mensagem: "Produto não localizado."
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 EasyStock Server ativo em http://localhost:${PORT}`);
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));

