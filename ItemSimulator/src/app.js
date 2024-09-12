import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import CharactersRouter from './routes/characters.router.js';
import ItemRouter from './routes/items.router.js'
import InventoryRouter from './routes/inventory.router.js'

const app = express();
const PORT = 3020;

app.use(express.json());
app.use(cookieParser());
app.use('/ItemSimulator', [UsersRouter], [CharactersRouter], [ItemRouter], [InventoryRouter]);

app.listen(PORT, () => {
    console.log(PORT, "아이템 시뮬레이터 서버 열림");
});