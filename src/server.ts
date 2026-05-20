
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
});





// ADICIONAR PRODUTO
app.post('/criar/produtos', async (req, res) => {
    try {
        const { codigo_barras, nome, marca, preco, descricao, quantidade } = req.body;

        if (!codigo_barras || !nome || !marca || !preco || !quantidade) {//verifica se os campos obrigatórios estão presentes
            return res.status(400).json({
                mensagem: "Campos obrigatórios: codigo_barras, nome, marca, preco, quantidade"
            });
        }

        // Cria o produto junto com o estoque inicial
        const novoProduto = await prisma.produto.create({
            data: {
                codigo_barras,
                nome,
                marca,
                preco: Number(preco),
                descricao,
                estoques: {
                    create: {//feito dessa forma para criar o estoque junto com o produto,
                    //  evitando a necessidade de criar o produto primeiro e depois o estoque
                        quantidade: Number(quantidade),
                        id_filial: 0 // valor fixo para não ser usado no momento
                    }
                }
            },
            include: { estoques: true }//confirmação
        });

        return res.status(201).json({//retorno para sucesso
            mensagem: "Produto cadastrado com sucesso!",
            produto: novoProduto
        });

    } catch (error: any) { // tipando como any para acessar code
        console.error(error);

        // Tratamento específico para erro de chave única
        if (error.code === 'P2002') {
            return res.status(400).json({ mensagem: "Já existe um produto com este código de barras" });
        }

        return res.status(500).json({ mensagem: "Erro ao cadastrar produto" });
    }
});


// LISTAR ESTOQUES 
//criado apenas para uma organização própria para analizar os endpoints feitos
app.get('/estoques', async (req, res) => {
    try {
        const estoques = await prisma.estoque.findMany({
            include: { produto: true }
        });
        return res.json(estoques);//retorna os estoques junto com as informações do produto relacionado
    } catch (error: any) {//tipando como any para acessar code
        console.error(error);
        return res.status(500).json({ mensagem: "Erro ao listar estoques" });//retorno erro
    }
});

// RETIRADA DE PRODUTO EM QUANTIDADE
app.put('/produtos/retirada', async (req, res) => {
    try {
        const { nome, quantidade } = req.body;

        if (!quantidade || quantidade <= 0) {//verifica se a quantidade é válida
            return res.status(400).json({ mensagem: "Informe uma quantidade válida para retirada" });
        }

        const produto = await prisma.produto.findFirst({//forma de busca
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


app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});