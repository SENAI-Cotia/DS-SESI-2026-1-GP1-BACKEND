import { Prisma } from "@prisma/client/extension";
import express from "express";
import { error } from "node:console";
import { json } from "node:stream/consumers";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});


//LISTA TODOS OS PRODUTOS CADASTRADOS
app.get("/produtos", async (req, res) => {
    try{
        const produtos = await prisma.produtos.findMany()  //Para pegar o livro do banco de dados nos vamos utilizar o prisma! ele sera ponte do banco de dados para a API
    res.json(produtos)
    }catch (error){
        res.status(500).json({error:"Ocorreu um erro ao listar os produtos"})
    }

})


//CADASTRO DE GERENTES
app.post("/cadastro/gerentes", async (req, res) => {
    const {nome, email, senha, id_filial} = req.body

    

    if(!nome || !email || !senha|| !id_filial){
        res.status(400).json({error: "Todos os campos são obrigatórios!"})
    }

    if(senha.length <8){
        res.status(400).json({error: "A senha precisa ter no mínimo 8 caracteres"})
    }

    const cadastro = await Prisma.gerentes.create({
        data: { nome,
                email,
                senha, 
                id_filial
        }
    })

    res.status(201).json(cadastro)
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

    const cadastroProduto = await Prisma.produtos.create({
        data: { produto,
                categoria,
                estoque_atual: Number(estoque_atual),
                estoque_minimo : Number(estoque_minimo)
        }
    })

    res.status(201).json(cadastroProduto)

})



app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});