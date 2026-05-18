
import express from "express";
import prisma from "./lib/prisma";

const app = express();


app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});


//LISTA TODOS OS PRODUTOS CADASTRADOS
app.get("/produtos", async (req, res) => {
    try{
        const produtos = await prisma.produto.findMany()  //Para pegar o livro do banco de dados nos vamos utilizar o prisma! ele sera ponte do banco de dados para a API
    res.json(produtos)
    }catch (error){
        res.status(500).json({error:"Ocorreu um erro ao listar os produtos"})
    }

})


//CADASTRO DE PRODUTOS
app.post("/cadastro/produtos", async (req, res) =>{
    const { produto, categoria, estoque_atual, estoque_minimo} = req.body

    if(!produto|| !categoria || !estoque_atual || !estoque_minimo){
        res.status(400).json({error: " Todos os campos são obrigatórios"})
    }

    if(estoque_minimo.length < 100){
        res.status(400).json({error:"É necessário que o estoque minimo desse produto seja maior ou igual a 100"})
    }

    const cadastroProduto = await prisma.produto.create({
        data: { produto,
                categoria,
                estoque_atual: Number(estoque_atual),
                estoque_minimo : Number(estoque_minimo)
        }
    })

    res.status(201).json(cadastroProduto)

})



//CADASTRO DE GERENTES
app.post("/gerentes", async (req, res) => {
    const {nome, email, senha} = req.body

    

    if(!nome || !email || !senha){
        return res.status(400).json({error: "Todos os campos são obrigatórios!"})
    }

    if(senha.length <8){
        return res.status(400).json({error: "A senha precisa ter no mínimo 8 caracteres"})
    }

    const cadastro = await prisma.gerente.create({
        data: { nome,
                email,
                senha, 
                id_filial: 1
        }
    })

    res.status(201).json(cadastro)
})



//LOGIN

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

 const user = await prisma.gerente.findUnique({
    where: {email: email}
 })

 if (!user){
    return res.status(404).json({ error: "E-mail ou senha incorretos, tente outra hora ou depois" });
 }

  // Verificação das informações corretas ou erradas
  if (email === user.email && 
      senha === user.senha) 
{
    return res.json({ message: "Login realizado com sucesso, bem vindo Ronaldo Luiz!" });
  } else {  
    return res.status(401).json({ error: "E-mail ou senha incorretos, tente outra hora ou depois" });
  }
})

//ADICIONAR NOVO PRODUTO
app.post('/criar/produtos', async (req, res) => {
    try {
        const { codigo_barras, nome, marca, preco, descricao } = req.body;

        // Validação simples: apenas os campos obrigatórios do schema
        if (!codigo_barras || !nome || !marca || !preco) {
            return res.status(400).json({
                mensagem: "Campos obrigatórios: codigo_barras, nome, marca, preco"
            });
        }

        // Cria o produto no banco via Prisma
        const novoProduto = await prisma.produto.create({
            data: {
                codigo_barras,
                nome,
                marca,
                preco: Number(preco), // garante que seja número
                descricao             // opcional
            }
        });

        return res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            produto: novoProduto
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao cadastrar produto" });
    }
});


//RETIRADA DE PROTUDO
app.delete('/produtos/dell', async (req, res) => {
    try {
        const { nome } = req.body;

        // Verifica se o produto existe
        const produto = await prisma.produto.findFirst({
            where: { nome: nome }
        });

        if (!produto) {
            return res.status(404).json({ mensagem: "Produto não encontrado, veja se escreveu corretamente" });
        }

        // Remove o produto
        await prisma.produto.delete({
            where: { id_produto: produto.id_produto }
        });

        return res.json({ mensagem: `Produto '${nome}' foi removido com sucesso!` });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao remover produto" });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});