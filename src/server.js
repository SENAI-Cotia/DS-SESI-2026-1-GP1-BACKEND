import express from "express";
import { json } from "node:stream/consumers";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/cadastro/gerentes", async (req, res) => {
    const {nome, email, senha, id_filial} = req.body

    

    if(!nome || !email || senha.length > 8 || !id_filial){
        res.status(400).json({error: "Todos os campos são obrigatórios!"})
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


app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});