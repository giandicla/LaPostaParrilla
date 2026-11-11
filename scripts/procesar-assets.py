"""Genera los assets del sitio a partir de la carpeta de branding de la familia.

Uso (desde la raíz del repo):
    python scripts/procesar-assets.py "../Branding y fotos"

Requiere PyMuPDF (fitz), Pillow y numpy. Es una herramienta de desarrollo:
el sitio no la ejecuta, solo consume lo que deja en public/ y app/.

Qué hace:
  1. Logo: extrae el vector de Logo.ai (es PDF por dentro) y arma variantes SVG
     recortadas y en un solo color (blanco / bordo), más el favicon.
  2. Fotos: convierte la selección de fotos a WebP de ancho acotado.

Las cartas ya no salen de acá (sesión 06): viven en la base, se editan en
/admin/carta y el PDF para imprimir lo arma /admin/carta/imprimir.
"""

import re
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / 'public'

BORDO = '#600003'
BLANCO = '#FFFFFF'

# Recortes del Logo.ai, en unidades del artboard (1080 x 1080).
# Medidos rasterizando el artboard y buscando la caja de los píxeles con tinta.
CAJA_MARCA = (146, 317, 820, 284)       # fogón + LA POSTA
CAJA_COMPLETA = (146, 317, 820, 402)    # + línea + PARRILLA PATAGONICA
CAJA_FOGON = (126.5, 363, 280, 280)     # solo el fogón, cuadrado

# (carpeta, archivo original, destino en public/img, ancho máximo)
P = 'Fotos La Posta I Parrilla'
R = 'Fotos La Posta II Restaurante'
FOTOS = [
    # Comunes
    (P, 'Cordero patagonico.jpg', 'comunes/hero-cordero.webp', 1638),
    (P, 'Salon calido.jpg', 'comunes/salon-calido.webp', 1200),
    (R, 'Entrada de noche iluminada.jpg', 'comunes/entrada-noche.webp', 1200),
    (P, 'Sirviendo vino.jpg', 'comunes/sirviendo-vino.webp', 1200),
    # Bienvenida del inicio (elegidas por el usuario, 2026-11-05)
    (P, 'Tira de asado 2.jpg', 'parrilla/tira-de-asado.webp', 1200),
    (R, 'Tres pizzas.jpg', 'restaurante/tres-pizzas.webp', 1200),
    # Parrilla
    (P, 'Plano mesa con comida de arriba.jpg', 'parrilla/hero.webp', 1638),
    (P, 'Frente con nieve.jpeg', 'parrilla/card.webp', 1200),
    (P, 'Cartel techo.jpg', 'parrilla/cartel.webp', 1200),
    (P, 'Cordero patagonico.jpg', 'parrilla/cordero-patagonico.webp', 1200),
    (P, 'Abriendo vino.jpg', 'parrilla/abriendo-vino.webp', 1200),
    (P, 'Cordero vino salon de fondo.jpg', 'parrilla/reserva.webp', 1200),  # /reservas
    (P, 'Cordero patagonico 2.jpg', 'parrilla/plato-cordero.webp', 1000),
    (P, 'Bife de chorizo 2.jpg', 'parrilla/plato-bife.webp', 1000),
    (P, 'Sorrentinos.jpg', 'parrilla/plato-sorrentinos.webp', 1000),
    (P, 'Postre don pedro.jpg', 'parrilla/plato-don-pedro.webp', 1000),
    # Restaurante
    (R, 'Plano mesa comida.jpg', 'restaurante/hero.webp', 1638),
    (R, 'Entrada restaurante.jpg', 'restaurante/card.webp', 1200),
    (R, 'Salon.jpg', 'restaurante/salon.webp', 1200),
    (R, 'Cuatro tipos empanadas plano arriba.jpg', 'restaurante/empanadas.webp', 1200),
    (R, 'Fogon chimenea.jpg', 'restaurante/fogon.webp', 1200),
    (R, 'Muebles con vinos.jpg', 'restaurante/vinos.webp', 1200),
    (R, 'plano mesa con fondo rustico.jpg', 'restaurante/reserva.webp', 1200),  # /reservas
    (R, 'Pizza rucula tomates secos.jpg', 'restaurante/plato-pizza.webp', 1000),
    (R, 'Albondigas y vino.jpg', 'restaurante/plato-albondigas.webp', 1000),  # luego recortada a la cazuela (2026-11-11, ver BITACORA)
    (R, 'Trucha con salsa.jpg', 'restaurante/plato-trucha.webp', 1000),
    (R, 'Volcan de chocolate con helado.jpg', 'restaurante/plato-volcan.webp', 1000),
]

def svg_logo(svg_base, caja, color, fondo=None):
    x, y, w, h = caja
    svg = svg_base.replace('#be1e2d', color).replace('#404041', color)
    svg = re.sub(
        r'width="1080" height="1080" viewBox="0 0 1080 1080"',
        f'width="{w}" height="{h}" viewBox="{x} {y} {w} {h}"',
        svg,
        count=1,
    )
    if fondo:
        # El fondo va primero, para quedar debajo del dibujo
        rect = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w * 0.18}" fill="{fondo}"/>'
        svg = re.sub(r'(<svg[^>]*>)', r'\1' + rect, svg, count=1)
    return svg


def logos(origen):
    pagina = fitz.open(origen / 'Logo.ai')[0]
    base = pagina.get_svg_image(text_as_path=True)
    destino = PUBLIC / 'logo'
    destino.mkdir(exist_ok=True)
    variantes = {
        'logo-blanco.svg': (CAJA_MARCA, BLANCO, None),
        'logo-bordo.svg': (CAJA_MARCA, BORDO, None),
        'logo-completo-blanco.svg': (CAJA_COMPLETA, BLANCO, None),
        'logo-completo-bordo.svg': (CAJA_COMPLETA, BORDO, None),
        # Ornamento de los títulos de sección: se usa como máscara CSS,
        # así que el color real lo pone el CSS, no el archivo.
        'fogon.svg': (CAJA_FOGON, BORDO, None),
    }
    for nombre, (caja, color, fondo) in variantes.items():
        (destino / nombre).write_text(svg_logo(base, caja, color, fondo), encoding='utf-8')
    # Favicon: Next lo toma solo desde app/icon.svg
    icono = svg_logo(base, CAJA_FOGON, BLANCO, BORDO)
    (RAIZ / 'app' / 'icon.svg').write_text(icono, encoding='utf-8')
    print('logos ok')


def fotos(origen):
    for carpeta, archivo, destino, ancho in FOTOS:
        imagen = ImageOps.exif_transpose(Image.open(origen / carpeta / archivo)).convert('RGB')
        if imagen.width > ancho:
            alto = round(imagen.height * ancho / imagen.width)
            imagen = imagen.resize((ancho, alto), Image.LANCZOS)
        salida = PUBLIC / 'img' / destino
        salida.parent.mkdir(parents=True, exist_ok=True)
        imagen.save(salida, 'WEBP', quality=80, method=6)
        print(f'{destino:40} {salida.stat().st_size // 1024:>5} KB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Uso: python scripts/procesar-assets.py "<carpeta de branding>"')
    origen = Path(sys.argv[1]).resolve()
    logos(origen)
    fotos(origen)
