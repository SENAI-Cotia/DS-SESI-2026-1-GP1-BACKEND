import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import prisma from "./lib/prisma";

const app = express();
app.use(express.json());

const PORT = 3000;
const SALT_ROUNDS = 10;

function excludePassword<T extends { senha?: string }>(user: T): Omit<T, "senha"> | null {
  if (!user) return null;
  const { senha, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Erro Interno do Servidor]:", err);
  return res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
};

app.get('/usuarios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [admins, gerentes] = await Promise.all([
      prisma.administrador.findMany(),
      prisma.gerente.findMany()
    ]);

    const adminsFormatados = admins.map(user => ({ ...excludePassword(user), tipo: 'administrador' }));
    const gerentesFormatados = gerentes.map(user => ({ ...excludePassword(user), tipo: 'gerente' }));

    return res.status(200).json([...adminsFormatados, ...gerentesFormatados]);
  } catch (error) {
    next(error);
  }
});

app.post('/administradores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, senha, id_filial } = req.body;
    if (!nome || !email || !senha || !id_filial) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }
    
    const hashedPassword = await hashPassword(senha);
    const admin = await prisma.administrador.create({
      data: { nome, email, senha: hashedPassword, id_filial: Number(id_filial) }
    });
    
    return res.status(201).json(excludePassword(admin));
  } catch (err) {
    next(err);
  }
});

app.patch('/administradores/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    const data = { ...req.body };
    if (data.id_filial) data.id_filial = Number(data.id_filial);
    if (data.senha) data.senha = await hashPassword(data.senha);

    const admin = await prisma.administrador.update({
      where: { id_usuario: id },
      data
    });
    
    return res.status(200).json(excludePassword(admin));
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Administrador não encontrado para atualização." });
    }
    next(err);
  }
});

app.delete('/administradores/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    await prisma.administrador.delete({
      where: { id_usuario: id }
    });
    return res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Administrador não encontrado." });
    }
    next(err);
  }
});

app.post('/gerentes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, senha, id_filial } = req.body;
    if (!nome || !email || !senha || !id_filial) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }
    if (senha.length < 8) {
      return res.status(400).json({ error: "A senha de segurança necessita de ao menos 8 caracteres." });
    }

    const hashedPassword = await hashPassword(senha);
    const gerente = await prisma.gerente.create({
      data: { nome, email, senha: hashedPassword, id_filial: Number(id_filial) }
    });
    
    return res.status(201).json(excludePassword(gerente));
  } catch (err) {
    next(err);
  }
});

app.patch('/gerentes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    const data = { ...req.body };
    if (data.id_filial) data.id_filial = Number(data.id_filial);
    if (data.senha) {
      if (data.senha.length < 8) {
        return res.status(400).json({ error: "A nova senha necessita de ao menos 8 caracteres." });
      }
      data.senha = await hashPassword(data.senha);
    }
    
    const gerente = await prisma.gerente.update({
      where: { id_usuario: id },
      data
    });
    
    return res.status(200).json(excludePassword(gerente));
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Gerente não localizado para alteração." });
    }
    next(err);
  }
});

app.delete('/gerentes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    await prisma.gerente.delete({
      where: { id_usuario: id }
    });
    return res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Gerente não localizado." });
    }
    next(err);
  }
});

app.get("/produtos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const produtos = await prisma.produto.findMany();
    return res.status(200).json(produtos);
  } catch (error) {
    next(error);
  }
});

app.get("/produtos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Identificador de produto inválido." });
    }

    const produto = await prisma.produto.findUnique({
      where: { id_produto: id }
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto indisponível ou não cadastrado no sistema." });
    }

    return res.status(200).json(produto);
  } catch (error) {
    next(error);
  }
});

app.post("/cadastro/produtos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produto, categoria, estoque_atual, estoque_minimo } = req.body;

    if (!produto || !categoria || estoque_atual === undefined || estoque_minimo === undefined) {
      return res.status(400).json({ error: "Todos os dados do produto devem ser enviados." });
    }

    if (Number(estoque_minimo) < 100) {
      return res.status(400).json({ error: "A quantidade mínima de segurança operacional em estoque deve ser de 100 unidades." });
    }

    const cadastroProduto = await prisma.produto.create({
      data: {
        produto,
        categoria,
        estoque_atual: Number(estoque_atual),
        estoque_minimo: Number(estoque_minimo)
      }
    });

    return res.status(201).json(cadastroProduto);
  } catch (error) {
    next(error);
  }
});


interface ProdutoMock {
  id: number;
  nome: string;
  categoria: string;
  codigoProduto: string;
  quantidade: number;
  preco: number;
  palavraChave: string[];
  emEstoque: boolean;
  imagem: string;
}

const bancoDados: ProdutoMock[] = [  
  {
    id: 1,
    nome: "Relógio Garmin Venu 4",
    categoria: "Smartwatches",
    codigoProduto: "EST-GAR-004",
    quantidade: 15,
    preco: 2800.00,
    palavraChave: ["relogio", "garmin", "venu", "smartwatch"],
    emEstoque: true,
    imagem: "https://estoque.easystock.com.br/fotos/garmin_venu4.png"
  },
  {
    id: 2,
    nome: "PlayStation 5 Edição Digital",
    categoria: "Games",
    codigoProduto: "EST-PS5-DIG",
    quantidade: 8,
    preco: 3999.90,
    palavraChave: ["console", "ps5", "playstation", "sony"],
    emEstoque: true,
    imagem: "https://estoque.easystock.com.br/fotos/ps5_digital.png"
  },
  {
    id: 3,
    nome: "Mouse Dell WM126",
    categoria: "Periféricos",
    codigoProduto: "EST-DEL-WM126",
    quantidade: 45,
    preco: 99.00,
    palavraChave: ["mouse", "dell", "sem fio", "wm126"],
    emEstoque: true,
    imagem: "https://estoque.easystock.com.br/fotos/mouse_wm126.png"
  },
  {
    id: 4,
    nome: "iPhone 17 Pro Max",
    categoria: "Smartphones",
    codigoProduto: "EST-IPH-17PM",
    quantidade: 12,
    preco: 9499.00,
    palavraChave: ["celular", "iphone", "apple", "17"],
    emEstoque: true,
    imagem: "https://estoque.easystock.com.br/fotos/iphone17_promax.png"
  }
];


app.get("/bancoDados/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ 
      empresa: "EasyStock", 
      erro: "Identificador numérico inválido." 
    });
  }

  const produto = bancoDados.find((item: ProdutoMock) => item.id === id);

  if (produto) {
    return res.status(200).json({
      empresa: "EasyStock",
      data: produto
    });
  }

  return res.status(404).json({
    empresa: "EasyStock",
    mensagem: "O produto buscado não existe em nossa base local."
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 EasyStock Server ativo em http://localhost:${PORT}`);
});