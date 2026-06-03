
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
    const { nome, categoria, preco, descricao, codigo_barra, estoque, imagem} = req.body

    if(!nome|| !categoria || !preco || !codigo_barra || !imagem){
        return res.status(400).json({error: " Todos os campos são obrigatórios"})
    }
    
    const cadastroProduto = await prisma.produto.create({
        data: { nome,
                categoria,
                preco: Number(preco), 
                descricao, 
                codigo_barra:  String(codigo_barra),
                imagem
        }
    })


    await prisma.estoque.create({
        data: {
        id_produto: cadastroProduto.id_produto,
        id_filial: 1,
        quantidade: Number(estoque)
    }
})

    res.status(201).json(cadastroProduto)

})



//CADASTRO DE GERENTES
app.post("/cadastro/gerentes", async (req, res) => {
    const {nome, email, senha, id_filial} = req.body


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


app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});