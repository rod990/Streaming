const express = require('express');
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const REAL_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4'
];

const MOVIES_BY_CATEGORY = {
  Todas: [
    { id: 'm-all-1', titulo: 'Avengers: Endgame', cat: 'Marvel', anio: 2019, rating: '8.4', img: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX500.jpg', desc: 'Los Vengadores restantes se reúnen una vez más para revertir las acciones de Thanos y restaurar el equilibrio del universo.' },
    { id: 'm-all-2', titulo: 'The Batman', cat: 'DC / Batman', anio: 2022, rating: '7.8', img: 'https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Batman investiga la corrupción oculta en Gotham City mientras persigue al asesino conocido como el Acertijo.' },
    { id: 'm-all-3', titulo: 'Interstellar', cat: 'Ciencia Ficción', anio: 2014, rating: '8.7', img: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un grupo de exploradores viaja a través de un agujero de gusano para encontrar un nuevo hogar para la humanidad.' },
    { id: 'm-all-4', titulo: 'Dune: Part Two', cat: 'Ciencia Ficción', anio: 2024, rating: '8.5', img: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Paul Atreides se une a los Fremen de Arrakis para vengar la caída de su familia.' },
    { id: 'm-all-5', titulo: 'Oppenheimer', cat: 'Drama', anio: 2023, rating: '8.3', img: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX500.jpg', desc: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la primera arma nuclear.' },
    { id: 'm-all-6', titulo: 'Spider-Man: Across the Spider-Verse', cat: 'Animación', anio: 2023, rating: '8.6', img: 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Miles Morales viaja a través del multiverso donde se encuentra con un equipo de Spider-Héroes.' }
  ],
  Marvel: [
    { id: 'm-mar-1', titulo: 'Avengers: Endgame', cat: 'Marvel', anio: 2019, rating: '8.4', img: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX500.jpg', desc: 'La batalla final de los Vengadores contra Thanos para salvar la mitad de toda la vida en el universo.' },
    { id: 'm-mar-2', titulo: 'Spider-Man: No Way Home', cat: 'Marvel', anio: 2021, rating: '8.2', img: 'https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmAxZS00YTM0LTg4MDAtY2ZjNjMzMmM2ODViXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Tras revelarse su identidad, Peter Parker pide ayuda a Doctor Strange y abre las puertas del multiverso.' },
    { id: 'm-mar-3', titulo: 'Guardians of the Galaxy Vol. 3', cat: 'Marvel', anio: 2023, rating: '7.9', img: 'https://m.media-amazon.com/images/M/MV5BOTJhOTMxMmItZmE0Ny00MDc3LWEzOGEtOGFkMzY4MWYyZDQ0XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Peter Quill reúne a su equipo para defender el universo y proteger la vida de Rocket.' },
    { id: 'm-mar-4', titulo: 'Doctor Strange in the Multiverse of Madness', cat: 'Marvel', anio: 2022, rating: '6.9', img: 'https://m.media-amazon.com/images/M/MV5BN2YxZGRjMzYtZjE1ZC00MDI0LThjZmQtZTZmMzVmZmQ2NzMwXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Doctor Strange viaja a realidades alternativas peligrosas para proteger a America Chavez.' },
    { id: 'm-mar-5', titulo: 'Iron Man', cat: 'Marvel', anio: 2008, rating: '7.9', img: 'https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_SX500.jpg', desc: 'Tras escapar de su cautiverio, el genio industrial Tony Stark construye una armadura de alta tecnología.' },
    { id: 'm-mar-6', titulo: 'Deadpool & Wolverine', cat: 'Marvel', anio: 2024, rating: '7.7', img: 'https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Wade Wilson se une a un reticente Wolverine para salvar su línea temporal de la extinción.' }
  ],
  'Star Wars': [
    { id: 'm-sw-1', titulo: 'Star Wars: Episode V - The Empire Strikes Back', cat: 'Star Wars', anio: 1980, rating: '8.7', img: 'https://m.media-amazon.com/images/M/MV5BMTkxNGFlNDktZmJkNC00MDdhLTg0MTEtZjZiYWI3MGE5NWIwXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Luke Skywalker entrena con el Maestro Yoda mientras Darth Vader persigue a la Alianza Rebelde.' },
    { id: 'm-sw-2', titulo: 'Rogue One: A Star Wars Story', cat: 'Star Wars', anio: 2016, rating: '7.8', img: 'https://m.media-amazon.com/images/M/MV5BMjEwMzMxODIzOV5BMl5BanBnXkFtZTgwNzg3OTAzMDI@._V1_SX500.jpg', desc: 'Un grupo de héroes improbables emprende una misión para robar los planos de la Estrella de la Muerte.' },
    { id: 'm-sw-3', titulo: 'Star Wars: Episode III - Revenge of the Sith', cat: 'Star Wars', anio: 2005, rating: '7.6', img: 'https://m.media-amazon.com/images/M/MV5BNTc4MTc3NTQ5OF5BMl5BanBnXkFtZTcwOTg0NjI4NA@@._V1_SX500.jpg', desc: 'Las Guerras Clon llegan a su fin mientras Anakin Skywalker cae hacia el lado oscuro de la Fuerza.' },
    { id: 'm-sw-4', titulo: 'Star Wars: Episode IV - A New Hope', cat: 'Star Wars', anio: 1977, rating: '8.6', img: 'https://m.media-amazon.com/images/M/MV5BOGUwMDk0Y2MtNjBlNi00NmRiLTk2MWYtMGMyMDlhYmI4ZDBjXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Luke Skywalker se une a Obi-Wan Kenobi y Han Solo para rescatar a la Princesa Leia del Imperio.' }
  ],
  'DC / Batman': [
    { id: 'm-dc-1', titulo: 'The Batman', cat: 'DC / Batman', anio: 2022, rating: '7.8', img: 'https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Batman sigue pistas crípticas por el inframundo de Gotham para detener al Acertijo.' },
    { id: 'm-dc-2', titulo: 'The Dark Knight', cat: 'DC / Batman', anio: 2008, rating: '9.0', img: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX500.jpg', desc: 'Batman enfrenta su mayor prueba psicológica y física cuando el Joker desata el caos en Gotham.' },
    { id: 'm-dc-3', titulo: 'Joker', cat: 'DC / Batman', anio: 2019, rating: '8.4', img: 'https://m.media-amazon.com/images/M/MV5BNzY3OWQ5NDktNWQ2OC00ZjdlLThkMmItMDhhNDk3NTFiZGU4XkEyXkFqcGc@._V1_SX500.jpg', desc: 'En 1981, un comediante marginado desciende hacia la locura y desencadena una revolución en Gotham.' },
    { id: 'm-dc-4', titulo: 'Man of Steel', cat: 'DC / Batman', anio: 2013, rating: '7.1', img: 'https://m.media-amazon.com/images/M/MV5BMTk5ODk1NDkxMF5BMl5BanBnXkFtZTcwNTA5OTY0OQ@@._V1_SX500.jpg', desc: 'Clark Kent descubre sus orígenes extraterrestres y debe defender la Tierra del General Zod.' }
  ],
  Acción: [
    { id: 'm-act-1', titulo: 'John Wick: Chapter 4', cat: 'Acción', anio: 2023, rating: '7.7', img: 'https://m.media-amazon.com/images/M/MV5BY2Q2ZmI5ZjUtNWVhMC00YzJkLTlmYjMtY2RmZDhkNzEzYjZhXkEyXkFqcGc@._V1_SX500.jpg', desc: 'John Wick descubre un camino para derrotar a la Alta Mesa enfrentando a enemigos en todo el mundo.' },
    { id: 'm-act-2', titulo: 'Top Gun: Maverick', cat: 'Acción', anio: 2022, rating: '8.2', img: 'https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Después de más de treinta años de servicio, Pete Maverick Mitchell entrena a una nueva generación de pilotos.' },
    { id: 'm-act-3', titulo: 'Mad Max: Fury Road', cat: 'Acción', anio: 2015, rating: '8.1', img: 'https://m.media-amazon.com/images/M/MV5BZDRkODJhOTgtOTc1OC00NTgzLTk4NjItNDYtZDY4MmE4YzI0NWFhXkEyXkFqcGc@._V1_SX500.jpg', desc: 'En un páramo postapocalíptico, Furiosa y Max huyen de un tirano a través del desierto.' },
    { id: 'm-act-4', titulo: 'Gladiator', cat: 'Acción', anio: 2000, rating: '8.5', img: 'https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWE1Zi00Y2U4LWI4NTAtMTU0MjkxNWQ1ZmJiXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un general romano traicionado lucha como gladiador en el Coliseo para vengar a su familia.' }
  ],
  'Ciencia Ficción': [
    { id: 'm-sci-1', titulo: 'Interstellar', cat: 'Ciencia Ficción', anio: 2014, rating: '8.7', img: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un equipo de astronautas viaja más allá de nuestra galaxia para buscar un planeta habitable.' },
    { id: 'm-sci-2', titulo: 'Dune: Part Two', cat: 'Ciencia Ficción', anio: 2024, rating: '8.5', img: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Paul Atreides lidera a los Fremen en una guerra por el control del planeta desértico Arrakis.' },
    { id: 'm-sci-3', titulo: 'Blade Runner 2049', cat: 'Ciencia Ficción', anio: 2017, rating: '8.0', img: 'https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX500.jpg', desc: 'El descubrimiento de un secreto enterrado lleva al oficial K a buscar al desaparecido Rick Deckard.' },
    { id: 'm-sci-4', titulo: 'Inception', cat: 'Ciencia Ficción', anio: 2010, rating: '8.8', img: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX500.jpg', desc: 'Un ladrón especializado en robar secretos del subconsciente recibe la misión de implantar una idea.' }
  ],
  Animación: [
    { id: 'm-ani-1', titulo: 'Spider-Man: Across the Spider-Verse', cat: 'Animación', anio: 2023, rating: '8.6', img: 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Miles Morales cruza el multiverso enfrentando una amenaza que pone en peligro cada realidad.' },
    { id: 'm-ani-2', titulo: 'Coco', cat: 'Animación', anio: 2017, rating: '8.4', img: 'https://m.media-amazon.com/images/M/MV5BMDIyM2E2NTAtMzlhNy00ZGUxLWI1NjgtZDY5MzhiMDc5NGU3XkEyXkFqcGc@._V1_SX500.jpg', desc: 'El joven aspirante a músico Miguel entra en la Tierra de los Muertos para descubrir la historia de su familia.' },
    { id: 'm-ani-3', titulo: 'Toy Story 4', cat: 'Animación', anio: 2019, rating: '7.7', img: 'https://m.media-amazon.com/images/M/MV5BMTYzMDM4NzkxOV5BMl5BanBnXkFtZTgwNzM1Mzg2NzM@._V1_SX500.jpg', desc: 'Woody, Buzz y el resto de los juguetes emprenden un viaje por carretera junto a Forky.' },
    { id: 'm-ani-4', titulo: 'Inside Out 2', cat: 'Animación', anio: 2024, rating: '7.6', img: 'https://m.media-amazon.com/images/M/MV5BYWY3MDE2Y2UtOTE3Zi00MGUzLTg2MTItZjE1ZWVkMGVlODRmXkEyXkFqcGc@._V1_SX500.jpg', desc: 'La mente de Riley recibe nuevas emociones encabezadas por Ansiedad al entrar en la adolescencia.' }
  ],
  Terror: [
    { id: 'm-ter-1', titulo: 'The Conjuring', cat: 'Terror', anio: 2013, rating: '7.5', img: 'https://m.media-amazon.com/images/M/MV5BMTM3NjA1NDMyMV5BMl5BanBnXkFtZTcwMDQzNDMzOQ@@._V1_SX500.jpg', desc: 'Los investigadores paranormales Ed y Lorraine Warren ayudan a una familia aterrorizada en una granja.' },
    { id: 'm-ter-2', titulo: 'A Quiet Place', cat: 'Terror', anio: 2018, rating: '7.5', img: 'https://m.media-amazon.com/images/M/MV5BMjI0MDMzNTQ0M15BMl5BanBnXkFtZTgwMTM5NzM3NDM@._V1_SX500.jpg', desc: 'Una familia debe vivir en absoluto silencio para esconderse de criaturas que cazan por el sonido.' },
    { id: 'm-ter-3', titulo: 'It', cat: 'Terror', anio: 2017, rating: '7.3', img: 'https://m.media-amazon.com/images/M/MV5BZDVkZmI0YzAtNzdjYi00ZjhhLWE1ODEtMWMzMWMzNDA0NmQ4XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un grupo de niños en Derry enfrenta sus peores miedos ante el malvado payaso Pennywise.' },
    { id: 'm-ter-4', titulo: 'Get Out', cat: 'Terror', anio: 2017, rating: '7.8', img: 'https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyNl5BMl5BanBnXkFtZTgwNzcwMzc0MTI@._V1_SX500.jpg', desc: 'Un joven descubre un perturbador secreto cuando conoce a la familia de su novia durante el fin de semana.' }
  ],
  Drama: [
    { id: 'm-dra-1', titulo: 'Oppenheimer', cat: 'Drama', anio: 2023, rating: '8.3', img: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX500.jpg', desc: 'El físico J. Robert Oppenheimer dirige el Proyecto Manhattan durante la Segunda Guerra Mundial.' },
    { id: 'm-dra-2', titulo: 'Parasite', cat: 'Drama', anio: 2019, rating: '8.5', img: 'https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX500.jpg', desc: 'La codicia y la discriminación de clases amenazan la relación simbiótica entre dos familias en Seúl.' },
    { id: 'm-dra-3', titulo: 'Whiplash', cat: 'Drama', anio: 2014, rating: '8.5', img: 'https://m.media-amazon.com/images/M/MV5BMDFjOWFkYzktYzhhMC00NmYyLTkwY2EtYjViNmFhN2Y3ZDU1XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un joven baterista de jazz es llevado al límite por un exigente instructor en un conservatorio.' },
    { id: 'm-dra-4', titulo: 'The Shawshank Redemption', cat: 'Drama', anio: 1994, rating: '9.3', img: 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Dos hombres encarcelados forjan una profunda amistad a lo largo de los años hallando consuelo y redención.' }
  ],
  Comedia: [
    { id: 'm-com-1', titulo: 'Free Guy', cat: 'Comedia', anio: 2021, rating: '7.1', img: 'https://m.media-amazon.com/images/M/MV5BOTY2NzFjODctOWUzMC00MGZhLTlhNjMtM2Y2ODBiNGY1ZWRiXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Un cajero de banco descubre que en realidad es un personaje secundario dentro de un videojuego.' },
    { id: 'm-com-2', titulo: 'Knives Out', cat: 'Comedia', anio: 2019, rating: '7.9', img: 'https://m.media-amazon.com/images/M/MV5BMGUwZjliMTAtNzAxZi00MWNiLWE2NzgtZGUxMGQxZjhhNDRiXkEyXkFqcGc@._V1_SX500.jpg', desc: 'El detective Benoit Blanc investiga la misteriosa muerte del patriarca de una excéntrica familia.' },
    { id: 'm-com-3', titulo: 'Superbad', cat: 'Comedia', anio: 2007, rating: '7.6', img: 'https://m.media-amazon.com/images/M/MV5BNjk0MzdlZGEtNTRkOC00ZDRiLWJkYjAtMzUzYTRiNzk1YTViXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Dos amigos inseparables intentan disfrutar al máximo su última fiesta antes de ir a la universidad.' },
    { id: 'm-com-4', titulo: 'The Hangover', cat: 'Comedia', anio: 2009, rating: '7.7', img: 'https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI5NmU3MjE2ODQzXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Tres amigos despiertan en Las Vegas sin recordar nada de la noche anterior y deben encontrar al novio.' }
  ],
  Fantasía: [
    { id: 'm-fan-1', titulo: 'Harry Potter and the Prisoner of Azkaban', cat: 'Fantasía', anio: 2004, rating: '7.9', img: 'https://m.media-amazon.com/images/M/MV5BMTY4NTIwODg0N15BMl5BanBnXkFtZTcwOTc0MjEzMw@@._V1_SX500.jpg', desc: 'Harry Potter enfrenta su tercer año en Hogwarts mientras el fugitivo Sirius Black anda suelto.' },
    { id: 'm-fan-2', titulo: 'The Lord of the Rings: The Return of the King', cat: 'Fantasía', anio: 2003, rating: '9.0', img: 'https://m.media-amazon.com/images/M/MV5BMTZkMjBjNWMtZGI5OC00MGU0LTk4ZTItODg2NWM3NTVmNWQ4XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Gandalf y Aragorn lideran el mundo de los hombres mientras Frodo y Sam se acercan al Monte del Destino.' },
    { id: 'm-fan-3', titulo: 'Pirates of the Caribbean: The Curse of the Black Pearl', cat: 'Fantasía', anio: 2003, rating: '8.1', img: 'https://m.media-amazon.com/images/M/MV5BNDhlMzEyNzItMTA5Mi00YWRhLThlNTktYTQyMTA0MDIyNDEyXkEyXkFqcGc@._V1_SX500.jpg', desc: 'El herrero Will Turner se une al excéntrico capitán Jack Sparrow para rescatar a Elizabeth Swann.' },
    { id: 'm-fan-4', titulo: "Pan's Labyrinth", cat: 'Fantasía', anio: 2006, rating: '8.2', img: 'https://m.media-amazon.com/images/M/MV5BYzFjMThiMGItOWRlMC00MDI4LThmOGUtYTNlZGZiYWI1YjMyXkEyXkFqcGc@._V1_SX500.jpg', desc: 'En la España de posguerra, la joven Ofelia descubre un laberinto mágico lleno de criaturas míticas.' }
  ],
  Anime: [
    { id: 'm-anm-1', titulo: 'Spirited Away', cat: 'Anime', anio: 2001, rating: '8.6', img: 'https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Durante su mudanza, una niña de diez años entra en un mundo gobernado por dioses, brujas y espíritus.' },
    { id: 'm-anm-2', titulo: 'Your Name', cat: 'Anime', anio: 2016, rating: '8.4', img: 'https://m.media-amazon.com/images/M/MV5BNGYyNmI3M2YtNzYzZS00OTViLTkxYjAtZDIyZmE1Y2U1ZmQ2XkEyXkFqcGc@._V1_SX500.jpg', desc: 'Dos adolescentes conectados misteriosamente comienzan a intercambiar cuerpos mientras buscan conocerse.' },
    { id: 'm-anm-3', titulo: 'Princess Mononoke', cat: 'Anime', anio: 1997, rating: '8.3', img: 'https://m.media-amazon.com/images/M/MV5BNGIzY2IzODQtNThmMi00ZDE4LWI5YzAtNzNlZTM1ZjYyYjUyXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Ashitaka queda atrapado en la lucha entre los dioses del bosque y los humanos que consumen sus recursos.' },
    { id: 'm-anm-4', titulo: 'Demon Slayer: Mugen Train', cat: 'Anime', anio: 2020, rating: '8.2', img: 'https://m.media-amazon.com/images/M/MV5BODI2NjdlYWItMTE1ZC00YzI2LTlhZGQtNzE3NzA4MWM0ODYzXkEyXkFqcGc@._V1_SX500.jpg', desc: 'Tanjiro y sus compañeros abordan el Tren Infinito junto al Pilar de la Llama Kyojuro Rengoku.' }
  ]
};

const SERIES_CATEGORY_TERMS = {
  Todas: 'stranger things',
  Marvel: 'daredevil',
  'Star Wars': 'mandalorian',
  'DC / Batman': 'gotham',
  Acción: 'the boys',
  'Ciencia Ficción': 'black mirror',
  Animación: 'arcane',
  Drama: 'breaking bad',
  Crimen: 'peaky blinders',
  Fantasía: 'the witcher',
  Anime: 'attack on titan',
  Comedia: 'the office'
};

const SERIES_FALLBACK_BY_CAT = {
  Todas: [
    { id: 's-all-1', titulo: 'Stranger Things', cat: 'Ciencia Ficción', anio: 2016, rating: '8.7', img: 'https://static.tvmaze.com/uploads/images/original_untouched/396/991288.jpg', desc: 'Un grupo de amigos descubre experimentos secretos y fuerzas sobrenaturales en Hawkins.' },
    { id: 's-all-2', titulo: 'The Last of Us', cat: 'Drama', anio: 2023, rating: '8.8', img: 'https://static.tvmaze.com/uploads/images/original_untouched/444/1111710.jpg', desc: 'Joel y Ellie cruzan un país devastado por una pandemia fúngica.' },
    { id: 's-all-3', titulo: 'Breaking Bad', cat: 'Crimen', anio: 2008, rating: '9.5', img: 'https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg', desc: 'Un profesor de química se transforma en un imperio del crimen en Nuevo México.' },
    { id: 's-all-4', titulo: 'The Mandalorian', cat: 'Star Wars', anio: 2019, rating: '8.7', img: 'https://static.tvmaze.com/uploads/images/original_untouched/448/1121792.jpg', desc: 'Un cazarrecompensas solitario protege a Grogu en los confines de la galaxia.' }
  ]
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, '').trim();
}

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'StreamGlobal/2.0' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function formatLocalMovies(list, idxOffset = 0) {
  return list.map((m, idx) => ({
    id: m.id,
    external_id: m.id,
    tipo: 'Película',
    titulo: m.titulo,
    descripcion: m.desc,
    categoria: m.cat,
    anio: m.anio,
    duracion: '2h 15m',
    thumbnail_url: m.img,
    video_url: REAL_STREAMS[(idx + idxOffset) % REAL_STREAMS.length],
    rating: m.rating,
    fuente: 'Catálogo Películas'
  }));
}

async function queryMoviesFromApis(term, categoryLabel) {
  const results = [];
  const seen = new Set();

  // 1. Si hay texto de búsqueda en tiempo real, buscar en API IMDb + catálogo local
  if (term && term.trim()) {
    const q = term.trim().toLowerCase();
    const imdbData = await fetchJsonWithTimeout(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(term.trim())}`);
    if (imdbData && Array.isArray(imdbData.description)) {
      imdbData.description.forEach((item, idx) => {
        const title = item['#TITLE'];
        const poster = item['#IMG_POSTER'];
        if (!title || !poster) return;
        const key = title.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        results.push({
          id: `imdb-${item['#IMDB_ID'] || idx}`,
          external_id: `imdb-${item['#IMDB_ID'] || idx}`,
          tipo: 'Película',
          titulo: title,
          descripcion: item['#ACTORS'] ? `Reparto: ${item['#ACTORS']}.` : `Película disponible en StreamGlobal: ${title}.`,
          categoria: 'Película',
          anio: item['#YEAR'] || 2024,
          duracion: 'HD',
          thumbnail_url: poster,
          video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
          rating: (7.7 + ((idx % 16) / 10)).toFixed(1),
          fuente: 'IMDb API'
        });
      });
    }

    // Complementar con coincidencias del catálogo completo
    Object.values(MOVIES_BY_CATEGORY).flat().forEach((m, idx) => {
      if (m.titulo.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q)) {
        const key = m.titulo.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push(formatLocalMovies([m], idx)[0]);
        }
      }
    });

    return results;
  }

  // 2. Si seleccionó una categoría, devolver películas reales de esa categoría + resultados extra de IMDb
  const baseList = MOVIES_BY_CATEGORY[categoryLabel] || MOVIES_BY_CATEGORY.Todas;
  formatLocalMovies(baseList).forEach((m) => {
    seen.add(m.titulo.toLowerCase());
    results.push(m);
  });

  const apiQuery = categoryLabel === 'Todas' ? 'avengers' : categoryLabel;
  const imdbExtra = await fetchJsonWithTimeout(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(apiQuery)}`);
  if (imdbExtra && Array.isArray(imdbExtra.description)) {
    imdbExtra.description.slice(0, 6).forEach((item, idx) => {
      const title = item['#TITLE'];
      const poster = item['#IMG_POSTER'];
      if (!title || !poster) return;
      const key = title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      results.push({
        id: `imdb-cat-${categoryLabel}-${item['#IMDB_ID'] || idx}`,
        external_id: `imdb-cat-${categoryLabel}-${item['#IMDB_ID'] || idx}`,
        tipo: 'Película',
        titulo: title,
        descripcion: item['#ACTORS'] ? `Reparto: ${item['#ACTORS']}.` : `Título destacado en ${categoryLabel}.`,
        categoria: categoryLabel === 'Todas' ? 'Cine' : categoryLabel,
        anio: item['#YEAR'] || 2024,
        duracion: 'HD',
        thumbnail_url: poster,
        video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
        rating: (7.8 + ((idx % 14) / 10)).toFixed(1),
        fuente: 'IMDb API'
      });
    });
  }

  return results;
}

async function querySeriesFromApis(term, categoryLabel) {
  const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`;
  const tvmazeData = await fetchJsonWithTimeout(url);

  const results = [];
  const seenTitles = new Set();

  if (Array.isArray(tvmazeData)) {
    tvmazeData.forEach((entry, idx) => {
      const show = entry.show;
      if (!show || !show.name || !show.image) return;
      const poster = show.image.original || show.image.medium;
      if (!poster) return;

      const key = show.name.toLowerCase();
      if (seenTitles.has(key)) return;
      seenTitles.add(key);

      results.push({
        id: `ser-${categoryLabel}-${show.id}`,
        external_id: `ser-${categoryLabel}-${show.id}`,
        tipo: 'Serie',
        titulo: show.name,
        descripcion: stripHtml(show.summary) || `Serie destacada en StreamGlobal: ${show.name}.`,
        categoria: categoryLabel !== 'Todas' ? categoryLabel : (show.genres?.[0] || 'Serie'),
        anio: show.premiered ? Number(show.premiered.slice(0, 4)) : 2024,
        duracion: show.runtime ? `${show.runtime} min/ep` : 'Temporadas HD',
        thumbnail_url: poster,
        video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
        rating: show.rating?.average || (8.1 + ((idx % 14) / 10)).toFixed(1),
        fuente: 'TVmaze API'
      });
    });
  }

  if (results.length === 0) {
    return SERIES_FALLBACK_BY_CAT.Todas.map((s, idx) => ({
      id: s.id,
      external_id: s.id,
      tipo: 'Serie',
      titulo: s.titulo,
      descripcion: s.desc,
      categoria: s.cat,
      anio: s.anio,
      duracion: 'Temporadas HD',
      thumbnail_url: s.img,
      video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
      rating: s.rating,
      fuente: 'Catálogo Series'
    }));
  }

  return results;
}

// GET /api/videos/external/movies?q=&category=
router.get('/external/movies', verifyToken, async (req, res) => {
  const { q = '', category = 'Todas' } = req.query;
  const results = await queryMoviesFromApis(q, category);
  res.json({ results });
});

// GET /api/videos/external/series?q=&category=
router.get('/external/series', verifyToken, async (req, res) => {
  const { q = '', category = 'Todas' } = req.query;
  const searchTerm = q.trim() ? q.trim() : (SERIES_CATEGORY_TERMS[category] || category);
  const results = await querySeriesFromApis(searchTerm, category);
  res.json({ results });
});

// GET /api/videos/favorites/me
router.get('/favorites/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.* FROM videos v
       INNER JOIN favorites f ON f.video_id = v.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
});

// POST /api/videos/favorites/:videoId
router.post('/favorites/:videoId', verifyToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const exists = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND video_id = $2',
      [req.user.id, videoId]
    );

    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND video_id = $2', [req.user.id, videoId]);
      return res.json({ saved: false, message: 'Eliminado de Mi Lista' });
    } else {
      await pool.query('INSERT INTO favorites (user_id, video_id) VALUES ($1, $2)', [req.user.id, videoId]);
      return res.json({ saved: true, message: 'Agregado a Mi Lista' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar Mi Lista' });
  }
});

// GET /api/videos/admin/stats
router.get('/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalVideos = await pool.query('SELECT COUNT(*) FROM videos');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalViews = await pool.query('SELECT COALESCE(SUM(vistas), 0) AS sum FROM videos');
    const totalFavs = await pool.query('SELECT COUNT(*) FROM favorites');

    res.json({
      totalVideos: Number(totalVideos.rows[0].count),
      totalUsers: Number(totalUsers.rows[0].count),
      totalViews: Number(totalViews.rows[0].sum),
      totalFavorites: Number(totalFavs.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// GET /api/videos
router.get('/', verifyToken, async (req, res) => {
  try {
    const { categoria, search } = req.query;
    let query = 'SELECT * FROM videos WHERE 1=1';
    const params = [];

    if (categoria && categoria !== 'Todas') {
      params.push(categoria);
      query += ` AND categoria = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (titulo ILIKE $${params.length} OR descripcion ILIKE $${params.length})`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar videos' });
  }
});

// POST /api/videos
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente } = req.body;
    if (!titulo || !video_url) {
      return res.status(400).json({ message: 'Título y URL del video son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO videos (titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo,
        descripcion || '',
        categoria || 'General',
        anio || 2025,
        duracion || '1h 30m',
        thumbnail_url,
        video_url,
        fuente || 'Panel Admin',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear video' });
  }
});

// PUT /api/videos/:id
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url } = req.body;

    const result = await pool.query(
      `UPDATE videos
       SET titulo=$1, descripcion=$2, categoria=$3, anio=$4, duracion=$5, thumbnail_url=$6, video_url=$7
       WHERE id=$8 RETURNING *`,
      [titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar video' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar video' });
  }
});

// POST /api/videos/:id/view
router.post('/:id/view', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id))) {
      return res.json({ vistas: 1 });
    }
    const result = await pool.query(
      'UPDATE videos SET vistas = vistas + 1 WHERE id = $1 RETURNING vistas',
      [id]
    );
    res.json(result.rows[0] || { vistas: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar vista' });
  }
});

module.exports = router;
