-- Carga inicial de la carta, generada por scripts/carta-a-sql.mjs desde
-- src/data/cartas.json y src/data/vinos.json (sesión 06). No editar a mano.

-- parrilla
update public.locales set cubierto = 1500 where id = 'parrilla';
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('entradas', 'parrilla', 'Entradas', null, null, null, 1);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'EMPANADA DE CARNE CORTADA A CUCHILLO', null, 'Fried chopped beef empanada / Empanada de carne cortada á faca', null, null, null, 6000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'CHORIZO', null, 'Chorizo (spicy pork & meat sausage) - Linguiça toscana', null, null, null, 6000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'MORCILLA', null, 'Grilled black pudding / Morcela', null, null, null, 6000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'MOLLEJAS', null, 'Grilled sweetbread / Timo de vitela', null, null, null, 35000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'PROVOLETA', null, 'Grilled provolone cheese / Provolone', null, null, null, 18000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'BASTONES DE MUZZARELLA', null, 'Mozzarella sticks / Palitos de muçarela', null, null, null, 15000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'BUÑUELOS DE ESPINACA', null, 'Spinach fritter / Croquetes de espinafre', null, null, null, 15000, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'SOPA DE VERDURAS', null, 'Vegetable soup / Sopa de legumes', null, null, null, 12000, null, 8),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas'), 'SOPA DEL DÍA', null, 'Roasted squash soup / Sopa do dia', null, null, null, 12000, null, 9);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('ensaladas', 'parrilla', 'Ensaladas', null, null, null, 2);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas'), 'ENSALADA 2 INGREDIENTES', null, 'Two ingredients salad / Salada 2 ingredientes', null, null, null, 12500, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas'), 'ENSALADA MIXTA', null, 'Mixed salad (tomato,lettuce & onion) / Salada mista (tomate,alface & cebola)', null, null, null, 12500, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas'), 'RÚCULA y PARMESANO', null, 'Arugula & parmesan cheese salad / Rúcula e parmesão', null, null, null, 16000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas'), 'ENSALADA LA POSTA', 'Rúcula, Tomates secos, Muzzarella, Olivas negras.', 'Arugula, Dried Tomatoes, Mozzarella, Black Olives. / Rúcula, Tomate seco, Muçarela, Azeitonas pretas.', null, null, null, 21000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas'), 'ENSALADA COMPLETA (6 ingredientes)', 'Ingredientes a elección: Lechuga, Tomate, Zanahoria, Cebolla, Remolacha, Chauchas, Choclo, Huevo.', 'Ingredients: Lettuce, Tomato, Carrot, Onion, Beetroot, Beans, Sweet corn, Egg / Ingredientes ã escolha: Alface, Tomate, Cenoura, Cebola, Beterraba, Vagem, Milho, Ovo.', null, null, null, 24000, null, 5);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('carnes-a-la-parrilla', 'parrilla', 'Carnes a la parrilla', null, 'Puntos de la carne: muy jugoso, jugoso, a punto, cocido.', null, 3);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'PATAMUSLO DESHUESADA', null, 'Grilled chicken leg quarter / Coxa e sobrecoxa de frango desossadas', null, null, null, 20000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'PECHUGA DE POLLO DESHUESADA', null, 'Grill chicken breast / Peito de frango desossado', null, null, null, 20000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'BONDIOLA DE CERDO', null, 'Grilled pork collar steak / Paleta suína', null, null, null, 20000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'BIFE DE CHORIZO', null, 'A typical and delicious Argentinian meat cut / Corte argentino de bife grosso de contra filê', null, null, null, 35000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'OJO DE BIFE', null, 'Ribeye / Corte bovino argentino tirado do miolo do contra filê', null, null, null, 37000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'LOMO GRILLADO', null, 'Grilled beef tenderloin / Filê mignon', null, null, null, 38000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'ENTRAÑA', null, 'Grilled skirt steak / Fraldinha feita na churrasqueira', null, null, null, 38000, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'ASADO ESPECIAL', null, 'bone-in beef roast / churrasco de boi com osso', null, null, null, 38000, null, 8),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'FALSA ENTRAÑA (para 2)', null, 'Falsa entraña (for 2) a meat cut next to the flank / Grilled skirt steak / Fino corte argentino de carne bovina,feito na churrasqueira', null, null, null, 60000, null, 9),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'CORDERO AL ASADOR', null, 'Grilled lamb / Cordeiro na churrasqueira', null, null, null, 39000, null, 10),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'carnes-a-la-parrilla'), 'CORDERO AL ASADOR (para 2)', null, 'Grilled lamb (for 2) / Cordeiro na churrasqueira (para 2)', null, null, null, 78000, null, 11);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('guarniciones', 'parrilla', 'Guarniciones', null, null, null, 4);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'HUEVOS FRITOS (2 unidades)', null, 'Sunny - side up fried eggs (2 units) / Ovos fritos', null, null, null, 5000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'ARROZ BLANCO', null, 'Boiled white rice / Arroz branco', null, null, null, 9000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PAPAS AL NATURAL', null, 'Boiled potatoes / Batatas ao natural', null, null, null, 9000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PAPAS FRITAS', null, 'Fries / Batatas fritas', null, null, null, 14000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PAPAS FRITAS PROVENZAL', null, 'Fries with garlic & parsley topping / Batatas fritas á provençal', null, null, null, 14500, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PURÉ DE PAPAS', null, 'Mashed potatoes / Purê de batata', null, null, null, 14000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PURÉ DE CALABAZAS AL HORNO', null, 'Roasted mashed squash / Purê de abóbora ao forno', null, null, null, 15000, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'PURÉ MIXTO', null, 'Squash mashed potatoes / Purê misto', null, null, null, 14500, null, 8),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'guarniciones'), 'TORTILLA A LA ESPAÑOLA', null, 'Tortilla Española / Tortilha espanhola', null, null, null, 20000, null, 9);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('platos', 'parrilla', 'Platos', null, null, null, 5);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'platos'), 'MILANESA DE CARNE CON GUARNICIÓN', null, 'Beef escalope with a side dish / Milanesa de carne com guarnição', null, null, null, 29000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'platos'), 'MILANESA NAPOLITANA CON GUARNICIÓN', null, 'Breaded beef cutlet topped with tomato sauce, Melted Mozzarella / & fresh tomato slices / Milanesa coberta com molho de tomate, rodelas de tomate fresco e queijo derretido.', null, null, null, 32000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'platos'), 'FILETE DE TRUCHA AL LIMÓN C/PAPAS al NATURAL', null, 'Grilled Patagonian Trout Fillet with boiled potatoes / Filé de truta grelhado, acompanhado por batatas cozidas ao natural.', null, null, null, 38000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'platos'), 'CORDERO BRASEADO DESHUESADO CON PURÉ', null, 'Cordero braseado with mashed potatoes (Boneless lamb cooked on special juicy sauce) / Cordeiro braseado dessosado com purê de batata', null, null, null, 42000, null, 4);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('pastas', 'parrilla', 'Pastas', null, 'Salsas a elección: fileto, crema o mixta.', null, 6);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'ÑOQUIS de Papa C/Salsa', null, 'Gnocchi / Nhoques ao molho sugo', null, null, null, 24000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'RAVIOLES de RICOTA C/Salsa', null, 'Ravioli (stuffed pasta with ricotta) / Raviolis ao molho sugo', null, null, null, 25000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'RAVIOLES MASA de ESPINACA C/VERDURA C/Salsa', null, 'Spinach ravioli filled with vegetables / Massa fresca verde recheada com espinafre. Servidos com o molho de sua preferência.', null, null, null, 25000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'SORRENTINOS de JAMON y MUZZARELLA C/Salsa', null, 'Sorrentino (stuffed pasta with mozzarella & ham) / Sorrentinos ao molho sugo', null, null, null, 28000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'SORRENTINOS de TRUCHA C/Salsa Crema de Limón', null, 'trout Sorrentino (Argentinian pasta filled with trout) with lemon / & cream sauce /Massa artesanal recheada com truta fresca, servida com molho leve e aromático de limão.', null, null, null, 32000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'SORRENTINOS de CORDERO C/Salsa de Finas Hierbas', null, 'Lamb Sorrentino ( Argentinian pasta filled with lamb) with aromatic herb-infused sauce. / Massa recheada com cordeiro macio, acompanhada de molho delicado de ervas aromáticas.', null, null, null, 32000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'pastas'), 'SALSA BOLOGNESA', null, 'Bolognese sauce / Molho à bolonhesa', null, null, null, 6000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('postres', 'parrilla', 'Postres', null, null, null, 7);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'FLAN CASERO (Con Dulce de Leche y/o Crema)', null, 'Flan casero with dulce de leche and/or cream / Pudim caseiro com doce de leite e/ou crema chantilly', null, null, null, 10000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'HELADO ARTESANAL (2 Gustos)', null, 'Homemade ice cream / Sorvete artesanal / Flavors: chocolate/strawberry/cream/dulce de leche', null, null, null, 12000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'QUESO y DULCE', null, 'Queijo com batata doce / Cheese and Sweet Potato Jam', null, null, null, 10000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'HELADO ARTESANAL CON FRUTOS DEL BOSQUE', null, 'Homemade ice cream & berries sauce topping / Sorvete artesanal com frutas vermelhas', null, null, null, 14000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'PANQUEQUES (De Dulce de Leche y/o Crema)', null, 'Thin french-style pancakes filled with dulce de leche either cream / Panquecas com doce de leite e/ creme chantilly', null, null, null, 12000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'BROWNIE CON HELADO ARTESANAL', null, 'Brownie with homemade ice cream / Brownie com sorvete artesanal', null, null, null, 14000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'CHEESE CAKE CON FRUTOS ROJOS', null, 'Cheese cake & homemade berries sauce / Cheese cake com frutas vermelhas', null, null, null, 12000, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'postres'), 'DON PEDRO', 'Con Chivas Regal', 'Dessert beverage made with ice cream, nuts and whiskey Dom Pedro: sorvete regado com whisky', null, null, null, 20000, null, 8);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('cafeteria', 'parrilla', 'Cafetería', null, null, null, 8);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cafeteria'), 'TÉ', null, null, null, null, null, 3500, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cafeteria'), 'CAFÉ', null, null, null, null, null, 4500, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cafeteria'), 'CAFÉ EN JARRITO', null, null, null, null, null, 4500, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cafeteria'), 'CAFÉ DOBLE', null, null, null, null, null, 5500, null, 4);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('bebidas-sin-alcohol', 'parrilla', 'Bebidas sin alcohol', null, null, null, 9);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'COCA COLA', null, null, null, null, null, 5500, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'COCA COLA SIN AZUCAR', null, null, null, null, null, 5500, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'FANTA', null, null, null, null, null, 5500, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'SPRITE', null, null, null, null, null, 5500, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'SCHWEPPES POMELO', null, null, null, null, null, 5500, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'SCHWEPPES TONICA', null, null, null, null, null, 5500, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'AGUA SABORIZADA LEVITE', null, null, null, null, null, 5500, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'AGUA CON GAS', null, null, null, null, null, 5500, null, 8),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'AGUA SIN GAS', null, null, null, null, null, 5500, null, 9),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'bebidas-sin-alcohol'), 'EXPRIMIDO NATURAL DE NARANJAS', null, null, null, null, null, 9000, null, 10);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('cervezas', 'parrilla', 'Cervezas', null, null, null, 10);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'ANDES ORIGEN 473 cc', null, null, null, null, null, 8500, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'STELLA ARTOIS 473 cc', null, null, null, null, null, 8500, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'STELLA ARTOIS NOIRE 473 cc', null, null, null, null, null, 8500, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'STELLA ARTOIS 473 cc (Sin Alcohol)', null, null, null, null, null, 7000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'PATAGONIA 730 cc', null, null, null, null, null, 15000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'CORONA 330 cc', null, null, null, null, null, 8500, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'cervezas'), 'CORONA 710 cc', null, null, null, null, null, 16000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('tragos-aperitivos-y-whiskys', 'parrilla', 'Tragos, aperitivos y whiskys', null, null, null, 11);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'APEROL SPRITZ', null, null, null, null, null, 10000, null, 1),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'GIN TONIC (Limón o Frutos Rojos)', null, null, null, null, null, 10000, null, 2),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'CAMPARI Con Naranja Natural', null, null, null, null, null, 10000, null, 3),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'FERNET BRANCA Con Coca Cola', null, null, null, null, null, 10000, null, 4),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'PISCO SOUR', null, null, null, null, null, 10000, null, 5),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'CINZANO ROSSO', null, null, null, null, null, 8000, null, 6),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'CYNAR (Pomelo o Tónica)', null, null, null, null, null, 8000, null, 7),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'NEGRONI', null, null, null, null, null, 10000, null, 8),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'RAMAZZOTTI', null, null, null, null, null, 7000, null, 9),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'RAMAZZOTTI SPRITZ', null, null, null, null, null, 10000, null, 10),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'TEQUILA JOSÉ CUERVO ESPECIAL', null, null, null, null, null, 10000, null, 11),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY CHIVAS REGAL 12 AÑOS', null, null, null, null, null, 12000, null, 12),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY JOHNNIE WALKER RED LABEL', null, null, null, null, null, 12000, null, 13),
  ((select id from public.carta_secciones where local_id = 'parrilla' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY JOHNNIE WALKER BLACK LABEL', null, null, null, null, null, 15000, null, 14);

-- restaurante
update public.locales set cubierto = 2000 where id = 'restaurante';
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('entradas', 'restaurante', 'Entradas', null, null, null, 1);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'CAZUELA DE MINI ALBONDIGAS', null, 'Mini meatball casserole simmered / Almôndegas mini ao molho', null, null, null, 16000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'BERENJENAS A LA PARMEGIANA', null, 'Baked eggplant Parmigiana / Berinjela à parmegiana', null, null, null, 14000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'PROVOLETA ESPECIAL', 'Con Peras y Nueces o Rucula y Tomates Secos', 'Grilled Provolone cheese With sweet pears and walnuts. or fresh arugula and sun-dried tomatoes / Com peras e nozes ou rúcula e tomate seco', null, null, null, 18000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'RAVIOLES FRITOS de Bondiola Braseada', null, 'Crispy fried ravioli / Recheado com bondiola (copa-lombo) braseada', null, null, null, 18000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'SOPA CREMA DE CEBOLLA', null, 'Creamy soup of onion / Sopa de cebola', null, null, null, 14000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'LANGOSTINOS AL AJILLO', null, 'Sautéed shrimp in garlic oil / Camarão rosa ao alho e óleo', null, null, null, 20000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas'), 'RABAS', null, 'Crispy golden calamari rings / Lula à dorê', null, null, null, 28000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('platos-especiales', 'restaurante', 'Platos especiales', null, 'Guarniciones a elección: papas fritas, puré de papas, arroz o ensalada.', null, 2);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'GOULASH CON SPAETZLE', null, null, null, null, null, 32000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'PASTEL DE PAPAS', null, 'Potato pie layered with beef/Escondidinho carne moída', null, null, null, 32000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'GUISO DE LENTEJAS', null, 'Traditional lentil stew / Guisado de lentilha', null, null, null, 28000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'TRUCHA AL ROQUEFORT CON GUARNICION', null, 'Trout topped Roquefort blue cheese cream sauce / Truta ao molho de gorgonzola', null, null, null, 38000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'MILANESA GRATINADA CON GUARNICION', null, 'Crispy breaded meat gratinéed / Milanesa gratinada', null, null, null, 32000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'OJO DE BIFE CON GUARNICION', null, 'Ribeye steak / Bife ancho', null, null, null, 45000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'WOK DE ARROZ YAMANI (Vegetales y Salsa de Soja)', null, 'Yamaní brown rice stir-fry with crisp seasonal vegetables / Wok de arroz integral com legumes e shoyu', null, null, null, 28000, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'RISOTTO DE HONGOS', null, 'Creamy rice risotto cooked with mixed mushrooms / Risoto de cogumelos', null, null, null, 39000, null, 8),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'HAMBURGUESA', 'Con Pepino Queso Provolone y Panceta / (Blend de 120Gr de carne especial)', 'Hamburguer with cucumbers, provolone cheese, and bacon / Hambúrguer com pepinos, queijo provolone e bacon', null, null, null, 28000, null, 9),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'platos-especiales'), 'HAMBURGUESA DOBLE', null, 'Doble Burger', null, null, null, 32000, null, 10);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('pastas-caseras-rellenas', 'restaurante', 'Pastas caseras rellenas', null, null, null, 3);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'RAVIOLONES DE VERDURA y RICOTA (Masa Verde)', null, 'Jumbo spinach and ricotta ravioli. / Ravióli de verdura e ricota (massa verde)', null, null, null, 20000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'RAVIOLONES DE RICOTA', null, 'Jumbo ricotta ravioli / Ravióli de ricota', null, null, null, 20000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'RAVIOLONES DE CORDERO Masa de Hongos de Pino', null, 'Jumbo ravioli stuffed with lamb / Ravióli de cordeiro', null, null, null, 25000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'CAPPELLETI DE TRUCHA', null, 'Patagonian trout cappelleti / Capeletti de truta', null, null, null, 25000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'SORRENTINOS CALABAZA, NUEZ y MUZZARELLA', '(Masa Verde)', 'Round, large sorrentino pasta filled with sweet pumpkin, walnuts, and mozzarella / Ravióli de ricota e presunto', null, null, null, 22000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-rellenas'), 'SORRENTINOS DE JAMÓN Y QUESO', null, 'Round, large sorrentino pasta stuffed with ham and cheese / Sorrentinos de presunto e queijo', null, null, null, 22000, null, 6);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('pastas-caseras-simples', 'restaurante', 'Pastas caseras simples', null, null, null, 4);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-simples'), 'ÑOQUIS DE ESPINACA (Gnocchis)', null, 'Spinach Gnocchis / Nhoque espinafre', null, null, null, 19000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-simples'), 'PAPARDELLE', null, 'Wide flat ribbon pasta / Pappardelle', null, null, null, 19000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pastas-caseras-simples'), 'TAGLIATELLE', null, 'Classic flat ribbon pasta / Tagliatelle', null, null, null, 19000, null, 3);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('salsas', 'restaurante', 'Salsas', null, null, null, 5);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'CREMA DE HONGOS', null, 'Creamy mushroom sauce / Cogumelos', null, null, null, 10000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'CREMA DE ROQUEFORT', null, 'Roquefort blue cheese cream sauce / Gorgonzola', null, null, null, 10000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'MEDITERRÁNEA', null, 'Mediterranean (tomato, olives, olive oil, and herbs) / Mediterrâneo', null, null, null, 9000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'BOLOÑESA', null, 'Bolognese / Bolonhesa', null, null, null, 10000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'PUTANESCA', null, 'Puttanesca (sauce with tomatoes, olive oil, anchovies, capers, and garlic) / Puttanesca', null, null, null, 9000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'PESTO DE ALBAHACA', null, 'Fresh basil pesto sauce / Pesto de manjericão', null, null, null, 6000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'POMODORO', null, 'Classic Italian tomato sauce / Pomodoro', null, null, null, 8000, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'salsas'), 'CREMA o ROSA', null, 'Smooth cream sauce / Branco / Mixed sauce (Pomodoro and cream blend) / Misto', null, null, null, 8000, null, 8);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('lasana', 'restaurante', 'Lasaña', null, null, null, 6);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'lasana'), 'LASAÑA DE CARNE, CARNE Y VERDURA', null, 'Meat ricotta and vegetable lasagna / Lasanha de carne ricota e legumes', null, null, null, 32000, null, 1);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('pizzas-clasicas', 'restaurante', 'Pizzas clásicas', null, null, array['Chica', 'Grande'], 7);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas'), 'MUZZARELLA', null, 'Tomato sauce, mozzarella, and oregano', null, null, null, null, '{21000,30000}', 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas'), 'NAPOLITANA', null, 'Tomato sauce, mozzarella, fresh sliced tomatoes, garlic, and olives', null, null, null, null, '{24000,32000}', 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas'), 'ESPECIAL DE JAMÓN Y MORRÓN', null, 'Tomato sauce, mozzarella, cured ham, and roasted red bell peppers / Especial de presunto e pimentão', null, null, null, null, '{25000,35000}', 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas'), 'FUGAZZA', null, 'Thick pizza crust loaded with sweet, seasoned sautéed onions and olive oil / Cebola e mussarela', null, null, null, null, '{21000,30000}', 4);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('pizzas-especiales', 'restaurante', 'Pizzas especiales', null, null, array['Chica', 'Grande'], 8);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-especiales'), 'PANCETA Y HONGOS', null, 'Tomato sauce, mozzarella, crispy bacon, and mushrooms / Bacon e cogumelos', null, null, null, null, '{28000,38000}', 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-especiales'), 'CUATRO QUESOS', null, 'Four cheese: mozzarella, roquefort, parmesan, provolone', null, null, null, null, '{28000,38000}', 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-especiales'), 'RÚCULA, TOMATES SECOS Y PARMESANO', null, 'Tomato sauce, mozzarella, fresh arugula, sun-dried tomatoes, and shaved parmesan / Rúcula, tomate seco e parmesão', null, null, null, null, '{26000,35000}', 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-especiales'), 'PERAS NUECES Y ROQUEFORT', null, 'Walnuts, pears and blue cheese / Nozes, peras e roquefort', null, null, null, null, '{28000,38000}', 4);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('empanadas-al-horno', 'restaurante', 'Empanadas al horno', null, null, null, 9);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'empanadas-al-horno'), 'CARNE CORTADA A CUCHILLO', null, 'Hand-cut beef spiced / Carne cortada na faca', null, null, null, 6000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'empanadas-al-horno'), 'POLLO', null, 'Seasoned shredded chicken / Frango', null, null, null, 4500, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'empanadas-al-horno'), 'JAMÓN Y QUESO', null, 'Diced ham and melted cheese / Presunto e queijo', null, null, null, 4500, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'empanadas-al-horno'), 'CEBOLLA Y MUZZARELLA', null, 'Sautéed sweet onions and mozzarella cheese / Cebola e mussarela', null, null, null, 4500, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'empanadas-al-horno'), 'QUESO Y VERDURA', null, 'Spinach with rich cheese / Queijo e verdura', null, null, null, 4500, null, 5);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('postres', 'restaurante', 'Postres', null, null, null, 10);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'TIRAMISU', null, null, null, null, null, 14000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'CREME BRULEE', null, null, null, null, null, 12000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'CRUMBLE DE MANZANA Con Helado de Canela', null, 'Apple crumble with cinnamon ice cream / Crumble de maçã com sorvete de canela', null, null, null, 14000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'BUDÍN DE PAN CON NARANJA', 'Con Helado de Crema Americana', 'Bread pudding with orange and cream ice cream / Pudim de pão com laranja com de sorvete de creme americano', null, null, null, 12000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'VOLCAN DE CHOCOLATE CON HELADO', null, 'Chocolate lava cake with cream ice cream / Vulcão de chocolate com sorvete de creme', null, null, null, 19000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'HELADO ARTESANAL (2 GUSTOS)', null, 'Homemade ice cream / Sorvete artesanal / Flavors: chocolate/strawberry/cream/dulce de leche', null, null, null, 12000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'DEGUSTACION DE DULCES EN ALMIBAR', null, 'Degustação de doces em calda / Preserved fruits tasting in syrup', null, null, null, 18000, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'postres'), 'DON PEDRO', null, 'Ice cream, nuts and whisky / Sorvete regado com whisky', null, null, null, 20000, null, 8);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('cafeteria-y-tes', 'restaurante', 'Cafetería y tés', null, null, null, 11);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cafeteria-y-tes'), 'TE', null, null, null, null, null, 3500, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cafeteria-y-tes'), 'CAFE', null, null, null, null, null, 5000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cafeteria-y-tes'), 'CAFE EN JARRITO', null, null, null, null, null, 5000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cafeteria-y-tes'), 'CAFE DOBLE', null, null, null, null, null, 6000, null, 4);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('bebidas-sin-alcohol', 'restaurante', 'Bebidas sin alcohol', null, null, null, 12);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'COCA COLA', null, null, null, null, null, 5500, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'COCA COLA SIN AZUCAR', null, null, null, null, null, 5500, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'FANTA', null, null, null, null, null, 5500, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'SPRITE', null, null, null, null, null, 5500, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'SCHWEPPES POMELO', null, null, null, null, null, 5500, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'SCHWEPPES TONICA', null, null, null, null, null, 5500, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'AGUA SABORIZADA LEVITE', null, null, null, null, null, 5500, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'AGUA CON GAS o SIN GAS', null, null, null, null, null, 5500, null, 8),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'bebidas-sin-alcohol'), 'EXPRIMIDO NATURAL DE NARANJAS', null, null, null, null, null, 9000, null, 9);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('cervezas', 'restaurante', 'Cervezas', null, null, null, 13);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'STELLA ARTOIS 473 cc o NOIRE 473 cc', null, null, null, null, null, 8500, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'STELLA ARTOIS 473 cc (Sin Alcohol)', null, null, null, null, null, 7500, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'STELLA ARTOIS PINTA', null, null, null, null, null, 8500, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'STELLA ARTOIS MEDIA PINTA', null, null, null, null, null, 6000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'PATAGONIA PINTA', null, null, null, null, null, 8500, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'PATAGONIA MEDIA PINTA', null, null, null, null, null, 6000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'CORONA 330 cc', null, null, null, null, null, 8500, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'cervezas'), 'CORONA 710 cc', null, null, null, null, null, 16000, null, 8);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('tragos-aperitivos-y-whiskys', 'restaurante', 'Tragos, aperitivos y whiskys', null, null, null, 14);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'APEROL SPRITZ', null, null, null, null, null, 10000, null, 1),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'GIN TONIC (Limón o Frutos Rojos)', null, null, null, null, null, 10000, null, 2),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'CAMPARI Con Naranja Natural', null, null, null, null, null, 10000, null, 3),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'FERNET BRANCA Con Coca Cola', null, null, null, null, null, 10000, null, 4),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'PISCO SOUR', null, null, null, null, null, 10000, null, 5),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'CINZANO ROSSO', null, null, null, null, null, 7000, null, 6),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'CYNAR (Pomelo o Tónica)', null, null, null, null, null, 7000, null, 7),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'NEGRONI', null, null, null, null, null, 10000, null, 8),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'RAMAZZOTTI', null, null, null, null, null, 7000, null, 9),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'RAMAZZOTTI SPRITZ', null, null, null, null, null, 10000, null, 10),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'TEQUILA JOSÉ CUERVO ESPECIAL', null, null, null, null, null, 10000, null, 11),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY CHIVAS REGAL 12 AÑOS', null, null, null, null, null, 14000, null, 12),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY JOHNNIE WALKER RED LABEL', null, null, null, null, null, 14000, null, 13),
  ((select id from public.carta_secciones where local_id = 'restaurante' and slug = 'tragos-aperitivos-y-whiskys'), 'WHISKY JOHNNIE WALKER BLACK LABEL', null, null, null, null, null, 16000, null, 14);

-- Vinos y copas: compartidos por los dos locales
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-malbec', null, 'Malbec', 'Vinos', null, null, 1);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'EL ENEMIGO', null, null, null, 'Aleanna', 'Valle de Uco, Mendoza', 46000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'NICASIA RED BLEND MALBEC', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 25000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'SAINT FELICIEN MALBEC', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 26000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'D.V. CATENA MALBEC MALBEC', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 48000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ANGELICA ZAPATA MALBEC ALTA', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 65000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'MALBEC ARGENTINO', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 155000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'PADRILLOS MALBEC', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 25000, null, 7),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ANIMAL COLORS MALBEC', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 28000, null, 8),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'TIKAL AMORIO', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 67000, null, 9),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'SIESTA MALBEC SINGLE VINEYARD', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 82000, null, 10),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'FAMILIA GASCON', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 16000, null, 11),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 25000, null, 12),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ESCORIHUELA GASCÓN GRAN RESERVA', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 35000, null, 13),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ESCORIHUELA GASCÓN ORGANIC VINEYARD', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 37000, null, 14),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ESCORIHUELA GASCÓN PEQUEÑAS PRODUCCIONES', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 65000, null, 15),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'DON MIGUEL ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 135000, null, 16),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'GRAN DANTE', null, null, null, 'Dante Robino', 'Lujan de Cuyo, Mendoza', 65000, null, 17),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'CORDERO CON PIEL DE LOBO', null, null, null, 'Familia Millan', 'Lujan de Cuyo y Valle de Uco, Mendoza', 20000, null, 18),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'SAURUS ESTATE', null, null, null, 'Familia Schroeder', 'San Patricio del Chañar, Neuquén Patagonia', 24000, null, 19),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'SAURUS SELECT', null, null, null, 'Familia Schroeder', 'San Patricio del Chañar, Neuquén Patagonia', 29000, null, 20),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'FINCA SOPHENIA ESTATE RESERVA', null, null, null, 'Finca Sophenia', 'Valle de Uco, Mendoza', 32000, null, 21),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'HUMBERTO CANALE ESTATE', null, null, null, 'Humberto Canale', 'Alto Valle, Rio Negro Patagonia', 28000, null, 22),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'DOS MAKILAS', null, null, null, 'Makila', 'San Rafael, Mendoza', 18000, null, 23),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'FAMILY RESERVE', null, null, null, 'Malma', 'San Patricio del Chañar, Neuquén Patagonia', 30000, null, 24),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ALAMBRADOS', null, null, null, 'Santa Julia', 'Maipú, Mendoza', 18000, null, 25),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'MANOS NEGRAS', null, null, null, 'Sejanovich', 'Valle de Uco, Mendoza', 25000, null, 26),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'TINTO NEGRO ALTAMIRA LA ESCUELA', null, null, null, 'Sejanovich', 'Valle de Uco, Mendoza', 52000, null, 27),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ZUCCARDI SERIE A', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 25000, null, 28),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ZUCCARDI Q', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 38000, null, 29),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ZUCCARDI POLIGONOS', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 52000, null, 30),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec'), 'ZUCCARDI CONCRETO', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 63000, null, 31);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-cabernet-sauvignon', null, 'Cabernet Sauvignon', 'Vinos', null, null, 2);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'ANGÉLICA ZAPATA CABERNET SAUVIGNON ALTA', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 58000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'BIRTH OF CABERNET', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 145000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'FAMILIA GASCON', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 16000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 25000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'ESCORIHUELA GASCÓN GRAN RESERVA', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 35000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'CORDERO CON PIEL DE LOBO', null, null, null, 'Familia Millan', 'Lujan de Cuyo y Valle de Uco, Mendoza', 20000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'FINCA SOPHENIA ESTATE RESERVA', null, null, null, 'Finca Sophenia', 'Valle de Uco, Mendoza', 32000, null, 7),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'DOS MAKILAS', null, null, null, 'Makila', 'San Rafael, Mendoza', 18000, null, 8),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'SANTA JULIA', null, null, null, 'Santa Julia', 'Maipú, Mendoza', 16000, null, 9),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-sauvignon'), 'ZUCCARDI Q', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 38000, null, 10);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-cabernet-franc', null, 'Cabernet Franc', 'Vinos', null, null, 3);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'EL ENEMIGO', null, null, null, 'Aleanna', 'Valle de Uco, Mendoza', 46000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'NICASIA RED BLEND CABERNET FRANC', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 25000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'MARA', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 39000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascón', 'Agrelo y Valle de Uco, Mendoza', 25000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'FINCA SOPHENIA ESTATE RESERVA', null, null, null, 'Finca Sophenia', 'Valle de Uco, Mendoza', 32000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'HUMBERTO CANALE ESTATE', null, null, null, 'Humberto Canale', 'Alto Valle, Rio Negro Patagonia', 28000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-cabernet-franc'), 'ZUCCARDI Q', null, null, null, 'Zuccardi', 'Valle de Uco, Mendoza', 38000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-pinot-noir', null, 'Pinot Noir', 'Vinos', null, null, 4);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'D.V. CATENA PINOT NOIR', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 42000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'PADRILLOS', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 28000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascon', 'Agrelo y Valle de Uco, Mendoza', 25000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'ESCORIHUELA GASCÓN PEQUEÑAS PRODUCCIONES', null, null, null, 'Escorihuela Gascon', 'Agrelo y Valle de Uco, Mendoza', 65000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'SAURUS ESTATE', null, null, null, 'Familia Schroeder', 'San Patricio del Chañar, Neuquén Patagonia', 27000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'GRAN RESERVA', null, null, null, 'Humberto Canale', 'Alto Valle, Rio Negro Patagonia', 70000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-pinot-noir'), 'FAMILY RESERVE', null, null, null, 'Malma', 'San Patricio del Chañar, Neuquén Patagonia', 36000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-blends', null, 'Blends', 'Vinos', null, null, 5);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'GRAN ENEMIGO', null, null, 'Cabernet Franc - Malbec', 'Aleanna', 'Valle de Uco, Mendoza', 98000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'SAINT FELICIEN', null, null, 'Cabernet Sauvignon - Merlot', 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 26000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'D.V. CATENA', null, null, 'Cabernet Sauvignon - Malbec', 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 35000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'ALMA NEGRA', null, null, 'Secreto', 'Ernesto Catena', 'Valle de Uco, Mendoza', 75000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'TIKAL NATURAL', null, null, 'Malbec - Syrah', 'Ernesto Catena', 'Valle de Uco, Mendoza', 70000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'THE PRESIDENT BLEND', null, null, 'Malbec - Cabernet Sauvignon - Syrah', 'Escorihuela Gascon', 'Valle de Uco, Mendoza', 75000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'BIOGRAFIA RED BLEND', null, null, '71%Malbec - 15%Cabernet Franc - 14%Bonarda', 'Dante Robino', 'Lujan de Cuyo, Mendoza', 80000, null, 7),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'GRAN ASSAMBLAGE', null, null, 'Malbec - Cabernet Sauvignon', 'Anaia', 'Agrelo, Mendoza', 36000, null, 8),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'SAPO DE OTRO POZO', null, null, '60%Malbec - 20% Syrah - 20%Cabernet Franc', 'Familia Millan', 'Lujan de Cuyo y Valle de Uco, Mendoza', 26000, null, 9),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'MOSQUITA MUERTA', null, null, '70%Malbec - 20%Cabernet Sauvignon - 5%Cabernet Franc - 5%Merlot', 'Familia Millan', 'Lujan de Cuyo y Valle de Uco, Mendoza', 31000, null, 10),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'SAURUS SELECT', null, null, 'Cabernet Sauvignon - Cabernet Franc', 'Familia Schroeder', 'San Patricio del Chañar, Neuquén Patagonia', 27000, null, 11),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'SYNTHESIS THE BLEND', null, null, 'Malbec - Cabernet Sauvignon - Merlot', 'Finca Sophenia', 'Valle de Uco, Mendoza', 98000, null, 12),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'MALMA UNIVERSO', null, null, 'Cabernet Sauvignon - Malbec', 'Malma', 'San Patricio del Chañar, Neuquén Patagonia', 56000, null, 13),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'TENSIÓN RIVERA MALBEC PETIT VERDOT', null, null, '90%Malbec - 10%Petit Verdot', 'Santa Julia', 'Maipú, Mendoza', 18000, null, 14),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'ZAHA EL CORTE', null, null, 'Cabernet Sauvignon - Malbec', 'Sejanovich', 'Valle de Uco, Mendoza', 46000, null, 15),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blends'), 'BRAZOS DE LOS ANDES', null, null, '45%Malbec - 28%Cabernet Sauvignon - 17%Syrah - 10%Bonarda', 'Zuccardi', 'Valle de Uco, Mendoza', 20000, null, 16);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-otras-cepas', null, 'Otras cepas', 'Vinos', null, null, 6);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'SAINT FELICIEN SYRAH', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 26000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'ANGELICA ZAPATA MERLOT ALTA', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 58000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'MARA MERLOT', null, null, null, 'Ernesto Catena', 'Valle de Uco, Mendoza', 35000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'ESCORIHUELA GASCÓN SANGIOVESE', null, null, null, 'Escorihuela Gascón', 'Agrelo, Mendoza', 25000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'BONARDA', null, null, null, 'Dante Robino', 'Lujan de Cuyo, Mendoza', 20000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'MAKILA PINOT MEUNIER', null, null, null, 'Makila', 'San Rafael, Mendoza', 18000, null, 6),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-otras-cepas'), 'FAMILY RESERVE MERLOT', null, null, null, 'Malma', 'San Patricio del Chañar, Neuquén Patagonia', 35000, null, 7);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-sauvignon-blanc', null, 'Sauvignon Blanc', 'Vinos', null, null, 7);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-sauvignon-blanc'), 'ESCORIHUELA GASCÓN', null, null, null, 'Escorihuela Gascon', 'Agrelo, Mendoza', 25000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-sauvignon-blanc'), 'PEQUEÑAS PRODUCCIONES', null, null, null, 'Escorihuela Gascon', 'Agrelo, Mendoza', 65000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-sauvignon-blanc'), 'SANTA JULIA', null, null, null, 'Santa Julia', 'Maipú, Mendoza', 16000, null, 3);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-chardonnay', null, 'Chardonnay', 'Vinos', null, null, 8);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-chardonnay'), 'SAINT FELICIEN', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 26000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-chardonnay'), 'ANGÉLICA ZAPATA - CHARDONNAY ALTA', null, null, null, 'Catena Zapata', 'Lujan de Cuyo, Mendoza', 58000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-chardonnay'), 'ANIMAL COLORS CHARDONNAY', null, null, null, 'Ernesto Catena', 'Agrelo, Mendoza', 28000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-chardonnay'), 'FAMILIA GASCÓN', null, null, null, 'Escorihuela Gascón', null, 16000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-chardonnay'), 'FAMILY RESERVE', null, null, null, 'Malma', 'San Patricio del Chañar, Neuquén Patagonia', 30000, null, 5);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-blancos-dulces-y-rosados', null, 'Blancos dulces y rosados', 'Vinos', null, null, 9);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'FAMILIA GASCÓN DULCE NATURAL', null, null, null, 'Escorihuela Gascón', 'Agrelo, Mendoza', 16000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'FAMILIA GASCÓN ROSE', null, null, null, 'Escorihuela Gascón', 'Agrelo, Mendoza', 16000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'ESCORIHUELA GASCÓN GRAN ROSE', null, null, null, 'Escorihuela Gascón', 'Agrelo, Mendoza', 35000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'CORDERO CON PIEL DE LOBO ROSE', null, null, null, 'Familia Millan', 'Lujan de Cuyo y Valle de Uco, Mendoza', 20000, null, 4),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'SANTA JULIA SYRAH ROSE', null, null, null, 'Santa Julia', 'Maipú, Mendoza', 16000, null, 5),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-blancos-dulces-y-rosados'), 'SANTA JULIA CHENIN DULCE', null, null, null, 'Santa Julia', 'Maipú, Mendoza', 16000, null, 6);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('vinos-espumantes', null, 'Espumantes', 'Vinos', null, null, 10);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-espumantes'), 'ANIMAL EXTRA BRUT ORGANICO', null, null, null, 'Ernesto Catena', null, 29000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-espumantes'), 'FAMILIA GASCON EXTRA BRUT', null, null, null, 'Escorihuela Gascón', null, 21000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'vinos-espumantes'), 'ESCORIHUELA GASCÓN ROSE EXTRA BRUT', null, null, null, 'Escorihuela Gascón', null, 26000, null, 3);
insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values ('copas-y-descorche', null, 'Copas y descorche', null, null, null, 11);
insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values
  ((select id from public.carta_secciones where local_id is null and slug = 'copas-y-descorche'), 'COPA DE VINO MALBEC', null, null, null, null, null, 9000, null, 1),
  ((select id from public.carta_secciones where local_id is null and slug = 'copas-y-descorche'), 'COPA DE VINO CABERNET SAUVIGNON', null, null, null, null, null, 9000, null, 2),
  ((select id from public.carta_secciones where local_id is null and slug = 'copas-y-descorche'), 'COPA DE VINO BLANCO', null, null, null, null, null, 9000, null, 3),
  ((select id from public.carta_secciones where local_id is null and slug = 'copas-y-descorche'), 'VALOR DESCORCHE', null, null, null, null, null, 12000, null, 4);
