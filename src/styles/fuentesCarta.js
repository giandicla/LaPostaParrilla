// Las fuentes de la hoja de la carta. Las cartas impresas usan fuentes
// comerciales (RT Flinton, HeyGotcha) sin licencia web: estas son las parecidas
// de Google. Si la familia consigue las originales, se cambian solo acá.
import { Oswald, Pathway_Gothic_One, Old_Standard_TT } from 'next/font/google';

const titulosRectos = Oswald({ subsets: ['latin'], weight: ['500', '600'], display: 'swap', variable: '--fuente-carta-recto' });
const titulosRedondeados = Pathway_Gothic_One({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--fuente-carta-redondeado' });
const texto = Old_Standard_TT({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--fuente-carta-texto' });

// Para el className de la hoja: define las tres variables
export const fuentesCarta = [titulosRectos.variable, titulosRedondeados.variable, texto.variable].join(' ');
