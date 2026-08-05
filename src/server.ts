
import express from "express"
import cors from "cors"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import { authenticate, requireAdmin } from "./middlewares/auth"
import prisma from "../lib/prisma";

const app = express();

app.use(cors())
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});


//LISTA TODOS OS PRODUTOS CADASTRADOS
app.get("/produtos", async (req, res) => {
    try {
        const produtos = await prisma.produto.findMany({
            include: {
                estoques: true
            }
        })
        res.json(produtos)
    } catch (error) {
        res.status(500).json({ error: "Ocorreu um erro ao listar os produtos" })
    }

})


//CADASTRO DE PRODUTOS
app.post("/cadastro/produtos", authenticate, async (req, res) => {
    const { nome, categoria, preco, descricao, codigo_barra, estoque, imagem } = req.body

    if (!nome || !categoria || !preco || !codigo_barra || !imagem || !estoque) {
        return res.status(400).json({ error: " Todos os campos são obrigatórios" })
    }

    const cadastroProduto = await prisma.produto.create({
        data: {
            nome,
            categoria,
            preco: Number(preco),
            descricao,
            codigo_barra: String(codigo_barra),
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

//Retornar produto por id
app.get("/produtos/:id", async (req, res) => {
    const id = parseInt(req.params.id)

    const produto = await prisma.produto.findFirst({
        where: { id_produto: id }
    })

    if (produto) {
        return res.json(produto)
    } else {
        res.status(404).json("Produto não encontrado!")
    }
})


// RETIRADA DE PRODUTO EM QUANTIDADE
app.put('/produtos/retirada', authenticate, async (req, res) => {
    try {
        const { nome, quantidade } = req.body;

        if (!quantidade || quantidade <= 0) {//verifica se a quantidade é válida
            return res.status(400).json({ mensagem: "Informe uma quantidade válida para retirada" });
        }

        const produto = await prisma.produto.findFirst({
            //forma de busca
            where: { nome }
        });

        if (!produto) {
            return res.status(404).json({ mensagem: "Produto não encontrado, veja se escreveu corretamente" });
        }

        // Busca estoque apenas pelo id_produto
        const estoque = await prisma.estoque.findFirst({
            where: { id_produto: produto.id_produto }
        });

        if (!estoque) {
            return res.status(404).json({ mensagem: "Não há estoque para este produto" });
        }

        if (estoque.quantidade < quantidade) {
            return res.status(400).json({ mensagem: "Quantidade solicitada maior que o estoque disponível" });
        }

        const estoqueAtualizado = await prisma.estoque.update({//atualiza o estoque subtraindo a quantidade retirada
            where: { id_estoque: estoque.id_estoque },
            data: { quantidade: estoque.quantidade - quantidade }
        });

        await prisma.movimentacao.create({//registra a movimentação de retirada
            data: {//dados para a movimentação
                id_filial: estoque.id_filial,
                id_produto: produto.id_produto,
                quantidade: -quantidade,
                tipo: "RETIRADA"
            }
        });

        return res.json({ //retorno para sucesso
            mensagem: `Retirada de ${quantidade} unidade(s) do produto '${nome}' realizada com sucesso!`,
            estoque: estoqueAtualizado
        });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao retirar produto" });
    }
});





//CADASTRO DE GERENTES
app.post("/cadastro/gerentes", async (req, res) => {
    try {
        const { nome, email, senha, id_filial, imagem, role } = req.body

        if (!nome || !email || !senha || !imagem || !id_filial || !role) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios!" })
        }

        if (senha.length < 8) {
            return res.status(400).json({ error: "A senha precisa ter no mínimo 8 caracteres" })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const cadastro = await prisma.gerente.create({
            data: {
                nome,
                email,
                senha: senhaCriptografada,
                imagem,
                role,
                id_filial: Number(id_filial) // garante que é número
            }
        })

        res.status(201).json(cadastro)

    } catch (error) {
        console.log(error) // mostra o erro exato no terminal
        res.status(500).json({ error: String(error) })
    }
})


// //LOGIN
// app.post("/login", async (req, res) => {
//     const { email, senha } = req.body;

//     const user = await prisma.gerente.findUnique({
//         where: { email: email }
//     })

//     if (!user) {
//         return res.status(404).json({ error: "E-mail ou senha incorretos, tente outra hora ou depois" });
//     }

//   // Verificação das informações corretas ou erradas
//   if (email === user.email )
// {
//     return res.json({ message: "Login realizado com sucesso, bem vindo!" });
//   } else {  
//     return res.status(401).json({ error: "E-mail ou senha incorretos, tente outra hora ou depois" });
//   }
// })


app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    // 1. Busca o usuário pelo e-mail
    const user = await prisma.gerente.findUnique({
        where: { email: email }
    });

    if (!user) {
        return res.status(404).json({ error: "E-mail ou senha incorretos, tente outra hora ou depois" });
    }


    // 3. Gerar o Token JWT (Defina uma chave secreta segura no seu .env)
    const SECRET_KEY = process.env.JWT_SECRET || "sesisenai";

    const token = jwt.sign(
        { id: user.id_usuario, email: user.email, nome: user.nome, role: user.role, senha: user.senha, imagem: user.imagem }, // Payload que vai dentro do token
        SECRET_KEY,

    );

    // 4. Retornar o token para o front-end
    return res.json({
        message: "Login realizado com sucesso, bem vindo!",
        token: token
    });
});




//LISTAR TODOS OS GERENTES
app.get("/gerentes", async (req, res) => {
    try {
        const gerentes = await prisma.gerente.findMany()
        res.json(gerentes)
    } catch (error) {
        res.status(500).json({ error: "Ocorreu um erro ao listar os produtos" })
    }

})

//BUSCAR GERENTE POR id
app.put("/gerente/:id", async (req, res) => {
    const id = parseInt(req.params.id)
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
        return res.status(400).json("Nome e Email são obrigatórios")
    }

    const gerente = await prisma.gerente.update({
        where: { id_usuario: id },
        data: { nome, email, senha }
    })

    return res.json(gerente)
})

//deletar gerente 
app.delete("/gerente/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id)

        const gerente = await prisma.gerente.findFirst({
            where: { id_usuario: id }
        })

        if (!gerente) {
            return res.status(404).json({ error: "Gerente não encontrado!" })
        }

        await prisma.gerente.delete({
            where: { id_usuario: id }
        })

        res.json({ message: "Gerente deletado com sucesso!" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Erro ao deletar gerente" })
    }
})

app.delete("/produtos/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id)

        const produto = await prisma.produto.findFirst({
            where: { id_produto: id }
        })

        if (!produto) {
            return res.status(404).json({ error: "produto não encontrado!" })
        }

        await prisma.movimentacao.deleteMany({
            where: { id_produto: id } // Ajuste o nome do campo se for diferente no seu schema
        });

        // 2. Deletar os estoques vinculados ao produto
        await prisma.estoque.deleteMany({
            where: { id_produto: id } // Ajuste o nome do campo se for diferente no seu schema
        });

        // 3. Agora sim, deletar o produto
        await prisma.produto.delete({
            where: { id_produto: id }
        });

        res.json({ message: "produto deletado com sucesso!" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Erro ao deletar produto" })
    }
})



app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});