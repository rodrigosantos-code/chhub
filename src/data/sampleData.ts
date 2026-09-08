import { Project } from '../types';

// Helper to create clean inline SVG data URLs
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// Background SVGs with high-aesthetic modern gradients and shapes
const bgLightEditorial = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5F3EF"/>
      <stop offset="60%" stop-color="#EBE7DE"/>
      <stop offset="100%" stop-color="#DCD4C4"/>
    </linearGradient>
    <radialGradient id="r1" cx="30%" cy="25%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#EBE7DE" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#g1)"/>
  <circle cx="350" cy="400" r="550" fill="url(#r1)"/>
  <circle cx="850" cy="1400" r="400" fill="#E2DAD0" opacity="0.5"/>
</svg>
`);

const bgDarkLuxury = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="gd" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181B"/>
      <stop offset="50%" stop-color="#121215"/>
      <stop offset="100%" stop-color="#09090B"/>
    </linearGradient>
    <radialGradient id="rd" cx="70%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#27272A" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#09090B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#gd)"/>
  <circle cx="750" cy="500" r="600" fill="url(#rd)"/>
  <path d="M-100 1200 Q400 900 1180 1300 L1180 1920 L-100 1920 Z" fill="#141417" opacity="0.7"/>
</svg>
`);

const bgTerracottaLight = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF5F0"/>
      <stop offset="50%" stop-color="#F2E6DC"/>
      <stop offset="100%" stop-color="#E8D1C0"/>
    </linearGradient>
    <linearGradient id="blob" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DFBCA5" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#C89D82" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#gt)"/>
  <path d="M200 200 C500 100 800 300 900 600 C1000 900 700 1200 500 1100 C300 1000 100 900 100 600 Z" fill="url(#blob)"/>
</svg>
`);

// Logos (Wordmarks & Monograms paired light/dark)
const logoWordmarkDark = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <text x="250" y="82" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="64" font-weight="900" letter-spacing="14" fill="#0F172A" text-anchor="middle">A U R A</text>
  <text x="250" y="110" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="8" fill="#475569" text-anchor="middle">STUDIO</text>
</svg>
`);

const logoWordmarkLight = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <text x="250" y="82" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="64" font-weight="900" letter-spacing="14" fill="#FFFFFF" text-anchor="middle">A U R A</text>
  <text x="250" y="110" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="8" fill="#E2E8F0" text-anchor="middle">STUDIO</text>
</svg>
`);

const logoSymbolDark = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="25" y="25" width="150" height="150" rx="35" fill="#1E293B"/>
  <path d="M100 45 L155 100 L100 155 L45 100 Z" fill="none" stroke="#FFFFFF" stroke-width="8"/>
  <circle cx="100" cy="100" r="16" fill="#FFFFFF"/>
</svg>
`);

const logoSymbolLight = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="25" y="25" width="150" height="150" rx="35" fill="#FFFFFF"/>
  <path d="M100 45 L155 100 L100 155 L45 100 Z" fill="none" stroke="#0F172A" stroke-width="8"/>
  <circle cx="100" cy="100" r="16" fill="#0F172A"/>
</svg>
`);

// Product images (vector rendered designer products)
const prodWatch = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Strap -->
    <rect x="330" y="50" width="140" height="700" rx="16" fill="#2E282A"/>
    <!-- Case -->
    <circle cx="400" cy="400" r="210" fill="#E0D7D0" stroke="#B8AAA0" stroke-width="6"/>
    <circle cx="400" cy="400" r="190" fill="#1C1A1C"/>
    <!-- Dial -->
    <circle cx="400" cy="400" r="180" fill="#221F22"/>
    <!-- Markers -->
    <line x1="400" y1="230" x2="400" y2="250" stroke="#FAF8F5" stroke-width="4"/>
    <line x1="400" y1="550" x2="400" y2="570" stroke="#FAF8F5" stroke-width="4"/>
    <line x1="230" y1="400" x2="250" y2="400" stroke="#FAF8F5" stroke-width="4"/>
    <line x1="550" y1="400" x2="570" y2="400" stroke="#FAF8F5" stroke-width="4"/>
    <!-- Hands -->
    <line x1="400" y1="400" x2="400" y2="290" stroke="#FAF8F5" stroke-width="5" stroke-linecap="round"/>
    <line x1="400" y1="400" x2="480" y2="440" stroke="#FAF8F5" stroke-width="4" stroke-linecap="round"/>
    <circle cx="400" cy="400" r="8" fill="#B48E58"/>
    <circle cx="400" cy="400" r="3" fill="#FAF8F5"/>
  </g>
</svg>
`);

const prodBag = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <filter id="shadowBag" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#shadowBag)">
    <!-- Handle -->
    <path d="M300 320 C300 170 500 170 500 320" fill="none" stroke="#78350F" stroke-width="26" stroke-linecap="round"/>
    <!-- Body -->
    <rect x="200" y="320" width="400" height="340" rx="40" fill="#9A3412"/>
    <!-- Flap -->
    <path d="M200 320 L600 320 L570 470 C570 500 540 520 500 520 L300 520 C260 520 230 500 230 470 Z" fill="#7C2D12"/>
    <!-- Buckle -->
    <rect x="360" y="470" width="80" height="50" rx="10" fill="#FBBF24" stroke="#D97706" stroke-width="4"/>
  </g>
</svg>
`);

const prodSunglasses = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <filter id="shadowGlass" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#shadowGlass)">
    <!-- Bridge -->
    <path d="M370 380 Q400 365 430 380" fill="none" stroke="#18181B" stroke-width="12" stroke-linecap="round"/>
    <!-- Left Rim -->
    <rect x="180" y="340" width="190" height="150" rx="40" fill="#18181B"/>
    <rect x="195" y="355" width="160" height="120" rx="28" fill="#3B82F6" opacity="0.75"/>
    <!-- Right Rim -->
    <rect x="430" y="340" width="190" height="150" rx="40" fill="#18181B"/>
    <rect x="445" y="355" width="160" height="120" rx="28" fill="#3B82F6" opacity="0.75"/>
  </g>
</svg>
`);

const prodPerfume = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <filter id="shadowPerf" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#shadowPerf)">
    <!-- Cap -->
    <rect x="340" y="160" width="120" height="90" rx="8" fill="#18181B"/>
    <!-- Neck -->
    <rect x="365" y="250" width="70" height="35" fill="#D4AF37"/>
    <!-- Bottle -->
    <rect x="250" y="285" width="300" height="380" rx="24" fill="#F8FAFC" opacity="0.95" stroke="#E2E8F0" stroke-width="4"/>
    <!-- Liquid -->
    <rect x="265" y="380" width="270" height="270" rx="16" fill="#FDE68A" opacity="0.6"/>
    <!-- Label -->
    <rect x="310" y="420" width="180" height="120" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
    <text x="400" y="475" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="900" letter-spacing="4" fill="#0F172A" text-anchor="middle">AURA</text>
    <text x="400" y="505" font-family="sans-serif" font-size="10" font-weight="600" letter-spacing="3" fill="#64748B" text-anchor="middle">PARFUM</text>
  </g>
</svg>
`);

export const DEFAULT_PROJECT: Project = {
  id: 'proj_aura',
  name: 'AURA Studio',
  description: 'Marca de diseño contemporáneo, accesorios y moda minimalista.',
  assetGroups: [
    {
      id: 'ag_summer_26',
      name: 'Colección Verano (SS26)',
      folders: {
        background: [
          {
            id: 'bg_light_1',
            name: 'Estudio Editorial Neutro',
            url: bgLightEditorial,
            tone: 'light',
            previewColor: '#F5F3EF',
          },
          {
            id: 'bg_dark_1',
            name: 'Obsidian Velvet Noche',
            url: bgDarkLuxury,
            tone: 'dark',
            previewColor: '#18181B',
          },
          {
            id: 'bg_terra_1',
            name: 'Terracota Suave Arena',
            url: bgTerracottaLight,
            tone: 'light',
            previewColor: '#FAF5F0',
          },
        ],
        logo_1: [
          {
            id: 'logo_word_dark',
            name: 'Logotipo Tipográfico (Oscuro)',
            url: logoWordmarkDark,
            tone: 'dark',
            oppositeId: 'logo_word_light',
          },
          {
            id: 'logo_word_light',
            name: 'Logotipo Tipográfico (Claro)',
            url: logoWordmarkLight,
            tone: 'light',
            oppositeId: 'logo_word_dark',
          },
        ],
        logo_2: [
          {
            id: 'logo_sym_dark',
            name: 'Monograma Isotipo (Oscuro)',
            url: logoSymbolDark,
            tone: 'dark',
            oppositeId: 'logo_sym_light',
          },
          {
            id: 'logo_sym_light',
            name: 'Monograma Isotipo (Claro)',
            url: logoSymbolLight,
            tone: 'light',
            oppositeId: 'logo_sym_dark',
          },
        ],
        logo_3: [],
        product_image_1: [
          {
            id: 'prod_watch',
            name: 'Reloj Minimalist Black',
            url: prodWatch,
            tone: 'dark',
          },
          {
            id: 'prod_bag',
            name: 'Bolso Artisan Terracotta',
            url: prodBag,
            tone: 'dark',
          },
          {
            id: 'prod_perfume',
            name: 'Perfume Esencial Nº 07',
            url: prodPerfume,
            tone: 'light',
          },
        ],
        product_image_2: [
          {
            id: 'prod_glasses',
            name: 'Gafas de Sol Óptica Azul',
            url: prodSunglasses,
            tone: 'dark',
          },
        ],
        product_image_3: [],
        texto_1: {
          fileName: 'titulares_verano.txt',
          content: 'Nueva Colección SS26, Esencia Minimalista, 20% en Lanzamiento, Diseñado para Durar',
          variations: [
            'Nueva Colección SS26',
            'Esencia Minimalista',
            '20% en Lanzamiento',
            'Diseñado para Durar',
          ],
        },
        texto_2: {
          fileName: 'subtitulos_promo.txt',
          content: 'Disponibilidad Limitada, Envío Gratuito 24h, Exclusivo en Web',
          variations: [
            'Disponibilidad Limitada',
            'Envío Gratuito 24h',
            'Exclusivo en Web',
          ],
        },
        texto_3: { fileName: 'texto_3.txt', content: '', variations: [] },
        texto_4: { fileName: 'texto_4.txt', content: '', variations: [] },
        texto_5: { fileName: 'texto_5.txt', content: '', variations: [] },
        texto_6: { fileName: 'texto_6.txt', content: '', variations: [] },
      },
    },
    {
      id: 'ag_winter_essentials',
      name: 'Colección Invierno (Capsule)',
      folders: {
        background: [
          {
            id: 'bg_dark_invierno',
            name: 'Midnight Slate Dark',
            url: bgDarkLuxury,
            tone: 'dark',
            previewColor: '#121215',
          },
          {
            id: 'bg_light_invierno',
            name: 'Alabastro Pure Light',
            url: bgLightEditorial,
            tone: 'light',
            previewColor: '#F0ECE1',
          },
        ],
        logo_1: [
          {
            id: 'logo_word_dark_w',
            name: 'Logotipo Tipográfico (Oscuro)',
            url: logoWordmarkDark,
            tone: 'dark',
            oppositeId: 'logo_word_light_w',
          },
          {
            id: 'logo_word_light_w',
            name: 'Logotipo Tipográfico (Claro)',
            url: logoWordmarkLight,
            tone: 'light',
            oppositeId: 'logo_word_dark_w',
          },
        ],
        logo_2: [
          {
            id: 'logo_sym_dark_w',
            name: 'Monograma Isotipo (Oscuro)',
            url: logoSymbolDark,
            tone: 'dark',
            oppositeId: 'logo_sym_light_w',
          },
          {
            id: 'logo_sym_light_w',
            name: 'Monograma Isotipo (Claro)',
            url: logoSymbolLight,
            tone: 'light',
            oppositeId: 'logo_sym_dark_w',
          },
        ],
        logo_3: [],
        product_image_1: [
          {
            id: 'prod_watch_w',
            name: 'Reloj Cronógrafo Negro',
            url: prodWatch,
            tone: 'dark',
          },
          {
            id: 'prod_perfume_w',
            name: 'Perfume Nocturne',
            url: prodPerfume,
            tone: 'light',
          },
        ],
        product_image_2: [
          {
            id: 'prod_bag_w',
            name: 'Bolso Piel Suave',
            url: prodBag,
            tone: 'dark',
          },
        ],
        product_image_3: [],
        texto_1: {
          fileName: 'titulares_invierno.txt',
          content: 'Cápsula Invierno 2026, Estilo Atemporal, Edición Limitada',
          variations: ['Cápsula Invierno 2026', 'Estilo Atemporal', 'Edición Limitada'],
        },
        texto_2: {
          fileName: 'subtitulos_invierno.txt',
          content: 'Exclusivo Miembros VIP, Envío Urgente Incluido',
          variations: ['Exclusivo Miembros VIP', 'Envío Urgente Incluido'],
        },
        texto_3: { fileName: 'texto_3.txt', content: '', variations: [] },
        texto_4: { fileName: 'texto_4.txt', content: '', variations: [] },
        texto_5: { fileName: 'texto_5.txt', content: '', variations: [] },
        texto_6: { fileName: 'texto_6.txt', content: '', variations: [] },
      },
    },
  ],
  templates: [
    {
      id: 'tmpl_editorial_master',
      name: 'Editorial Campaña Principal',
      description: 'Diseño publicitario con fondo dinámico, producto central, logo con contraste automático y copy condicional según el tono.',
      templateType: 'single',
      activeAspectRatios: ['1:1', '4:5', '9:16'],
      layers: [
        {
          id: 'layer_bg',
          name: 'Fondo Principal',
          folderType: 'background',
          dynamizationType: 'by_folder',
          visible: true,
          positionsByRatio: {
            '1:1': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '4:5': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '9:16': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '16:9': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
          },
        },
        {
          id: 'layer_product',
          name: 'Hero Producto',
          folderType: 'product_image_1',
          dynamizationType: 'by_folder',
          visible: true,
          positionsByRatio: {
            '1:1': { x: 15, y: 22, width: 70, height: 50, opacity: 1, objectFit: 'contain' },
            '4:5': { x: 12, y: 22, width: 76, height: 52, opacity: 1, objectFit: 'contain' },
            '9:16': { x: 10, y: 28, width: 80, height: 44, opacity: 1, objectFit: 'contain' },
            '16:9': { x: 30, y: 15, width: 40, height: 70, opacity: 1, objectFit: 'contain' },
          },
        },
        {
          id: 'layer_logo',
          name: 'Logo Marca',
          folderType: 'logo_1',
          dynamizationType: 'by_contrast', // Dinamización por contraste con el fondo!
          visible: true,
          positionsByRatio: {
            '1:1': { x: 25, y: 6, width: 50, height: 12, opacity: 1, objectFit: 'contain' },
            '4:5': { x: 25, y: 6, width: 50, height: 11, opacity: 1, objectFit: 'contain' },
            '9:16': { x: 25, y: 10, width: 50, height: 10, opacity: 1, objectFit: 'contain' },
            '16:9': { x: 5, y: 8, width: 25, height: 15, opacity: 1, objectFit: 'contain' },
          },
        },
        {
          id: 'layer_headline',
          name: 'Titular de Campaña',
          folderType: 'texto_1',
          dynamizationType: 'by_folder', // by_folder con regla condicional if/else evaluando layer_logo
          conditionalRule: {
            dependsOnLayerId: 'layer_logo',
            condition: 'resolved_tone_is_dark',
            folderIfTrue: 'texto_1', // Si logo es oscuro (fondo claro) -> texto_1
            folderIfFalse: 'texto_2', // Si logo es claro (fondo oscuro) -> texto_2
          },
          visible: true,
          positionsByRatio: {
            '1:1': {
              x: 8,
              y: 75,
              width: 84,
              height: 14,
              fontSize: 54,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              textShadow: false,
              opacity: 1,
            },
            '4:5': {
              x: 8,
              y: 77,
              width: 84,
              height: 14,
              fontSize: 54,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              textShadow: false,
              opacity: 1,
            },
            '9:16': {
              x: 8,
              y: 76,
              width: 84,
              height: 14,
              fontSize: 58,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              textShadow: false,
              opacity: 1,
            },
            '16:9': {
              x: 5,
              y: 55,
              width: 45,
              height: 25,
              fontSize: 48,
              fontWeight: 'black',
              textAlign: 'left',
              textColor: '#0F172A',
              textShadow: false,
              opacity: 1,
            },
          },
        },
      ],
    },
    {
      id: 'tmpl_story_special',
      name: 'Story & Reel Drop',
      description: 'Formato vertical optimizado para Stories y TikTok con símbolo de marca y llamado a la acción.',
      templateType: 'single',
      activeAspectRatios: ['9:16', '1:1'],
      layers: [
        {
          id: 'st_bg',
          name: 'Fondo',
          folderType: 'background',
          dynamizationType: 'by_folder',
          visible: true,
          positionsByRatio: {
            '9:16': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '1:1': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '4:5': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '16:9': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
          },
        },
        {
          id: 'st_symbol',
          name: 'Isotipo',
          folderType: 'logo_2',
          dynamizationType: 'by_contrast',
          visible: true,
          positionsByRatio: {
            '9:16': { x: 40, y: 8, width: 20, height: 10, opacity: 1, objectFit: 'contain' },
            '1:1': { x: 42, y: 6, width: 16, height: 14, opacity: 1, objectFit: 'contain' },
            '4:5': { x: 42, y: 6, width: 16, height: 12, opacity: 1, objectFit: 'contain' },
            '16:9': { x: 8, y: 10, width: 12, height: 18, opacity: 1, objectFit: 'contain' },
          },
        },
        {
          id: 'st_prod',
          name: 'Detalle Producto',
          folderType: 'product_image_2',
          dynamizationType: 'by_folder',
          visible: true,
          positionsByRatio: {
            '9:16': { x: 15, y: 25, width: 70, height: 42, opacity: 1, objectFit: 'contain' },
            '1:1': { x: 20, y: 22, width: 60, height: 50, opacity: 1, objectFit: 'contain' },
            '4:5': { x: 18, y: 22, width: 64, height: 50, opacity: 1, objectFit: 'contain' },
            '16:9': { x: 40, y: 15, width: 35, height: 70, opacity: 1, objectFit: 'contain' },
          },
        },
        {
          id: 'st_text',
          name: 'Copy Titular',
          folderType: 'texto_1',
          dynamizationType: 'by_folder',
          visible: true,
          positionsByRatio: {
            '9:16': {
              x: 10,
              y: 72,
              width: 80,
              height: 16,
              fontSize: 60,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              textBgColor: 'rgba(255,255,255,0.7)',
              opacity: 1,
            },
            '1:1': {
              x: 10,
              y: 74,
              width: 80,
              height: 16,
              fontSize: 52,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              textBgColor: 'rgba(255,255,255,0.7)',
              opacity: 1,
            },
            '4:5': {
              x: 10,
              y: 74,
              width: 80,
              height: 16,
              fontSize: 54,
              fontWeight: 'black',
              textAlign: 'center',
              textColor: '#0F172A',
              opacity: 1,
            },
            '16:9': {
              x: 5,
              y: 40,
              width: 35,
              height: 30,
              fontSize: 44,
              fontWeight: 'black',
              textAlign: 'left',
              textColor: '#0F172A',
              opacity: 1,
            },
          },
        },
      ],
    },
  ],
};
