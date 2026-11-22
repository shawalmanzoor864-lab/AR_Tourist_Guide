export type ModuleId = 'lahore-fort' | 'japanese-pavilion';
export type VoiceLanguage = 'en' | 'ur' | 'ja';
export type ArBackdropMode = 'studio-3d' | 'ar-backdrop' | 'live-camera';
export type LightingPreset = 'golden-hour' | 'twilight';

export interface TourStop {
  id: string;
  module: ModuleId;
  name: string;
  localName: string;
  era: string;
  category: string;
  summary: string;
  highlight: string;
  /** World position of the landmark center */
  position: [number, number, number];
  /** Where the 3D guide avatar stands when narrating this stop */
  guideSpot: [number, number, number];
  /** Ideal camera position when framing this stop */
  cameraPos: [number, number, number];
  /** Ideal OrbitControls target when framing this stop */
  cameraTarget: [number, number, number];
  /** English voice-over script */
  narrationEn: string;
  /** Roman-Urdu / Urdu-English voice-over script for Lahore Fort */
  narrationUr?: string;
  /** Japanese voice-over script for Japanese Pavilion */
  narrationJa?: string;
}

export const AR_BACKDROP_IMAGES: Record<ModuleId, string> = {
  'lahore-fort': '/src/assets/images/ar_lahore_fort_courtyard_1795114418543.jpg',
  'japanese-pavilion': '/src/assets/images/ar_japanese_garden_machiya_1795114418065.jpg',
};

/** Recorded Lahore Fort voice-over (served from /public/audio) */
export const LAHORE_FORT_VOICEOVER_URL = `${import.meta.env.BASE_URL}audio/lahore-fort-voiceover.mp3`;
/** Stops that play the recorded voice-over instead of the built-in text-to-speech narration */
export const LAHORE_FORT_VOICEOVER_STOP_IDS = ['alamgiri-gate'];

/** Recorded Japanese commander voice-over (replaces the old text-to-speech narration) */
export const JAPANESE_VOICEOVER_URL = `${import.meta.env.BASE_URL}audio/japanese-voiceover.mp3`;

/**
 * Navigation cues for the recorded Lahore Fort voice-over: when the audio reaches `at` seconds,
 * the camera + guide move to that stop (same as clicking its button).
 * NOTE: these times are PLACEHOLDERS (even split of the 2:45 recording). Replace each `at`
 * with the second where that place starts being mentioned in the audio.
 */
export const LAHORE_FORT_VOICEOVER_CUES: Array<{ at: number; stopId: string }> = [
  { at: 0, stopId: 'alamgiri-gate' },
  { at: 27, stopId: 'sheesh-mahal' },
  { at: 55, stopId: 'diwan-e-aam' },
  { at: 82, stopId: 'naulakha-pavilion' },
  { at: 110, stopId: 'picture-wall' },
  { at: 137, stopId: 'moti-masjid' },
];

export const LAHORE_FORT_STOPS: TourStop[] = [
  {
    id: 'alamgiri-gate',
    module: 'lahore-fort',
    name: 'Alamgiri Gate',
    localName: 'عالمگیری دروازہ',
    era: '1673 CE · Emperor Aurangzeb',
    category: 'Imperial Entrance',
    summary:
      'Constructed as the ceremonial royal entrance facing the Badshahi Mosque, framed by twin fluted bastion towers topped with lotus-bud marble domes.',
    highlight: 'Twin fluted sandstone bastions & grand pointed Mughal pishtaq arch',
    position: [0, 1.2, -0.3],
    guideSpot: [1.9, 0, 1.5],
    cameraPos: [3.8, 2.6, 6.8],
    cameraTarget: [0, 1.7, -0.6],
    narrationEn:
      'Welcome to the Alamgiri Gate, the grand western entrance of Lahore Fort built in 1673 by Emperor Aurangzeb. Notice the twin semi-circular fluted towers crowned with white marble lotus domes. Imperial processions once marched beneath this towering sandstone arch straight toward the Badshahi Mosque courtyard.',
    narrationUr:
      'Assalam-o-Alaikum! Khush amdeed Lahore Fort ke Alamgiri Gate par. Yeh shahi darwaza 1673 mein Badshah Aurangzeb ne banwaya tha. Is ke dono taraf gol minar aur upar safed sang-e-marmar ke gumbad hain, jahan se shahi qafilay Badshahi Masjid ki taraf guzarte thay.',
  },
  {
    id: 'sheesh-mahal',
    module: 'lahore-fort',
    name: 'Sheesh Mahal',
    localName: 'شیش محل',
    era: '1631 CE · Emperor Shah Jahan',
    category: 'Palace of Mirrors',
    summary:
      'Set within the Shah Burj quadrangle, its marble walls and vaulted ceilings are inlaid with thousands of convex mirrors and gilded stucco work.',
    highlight: 'Convex Aleppo mirror mosaic ceiling & cusped Makrana marble arches',
    position: [-2.7, 2.2, -0.3],
    guideSpot: [-1.2, 0, 1.6],
    cameraPos: [-4.6, 3.0, 6.4],
    cameraTarget: [-2.7, 2.4, -0.6],
    narrationEn:
      'You are now looking at Sheesh Mahal, the famed Palace of Mirrors commissioned by Emperor Shah Jahan in 1631. Over nine hundred thousand tiny convex mirrors from Aleppo were embedded into the vaulted plaster ceiling so that a single candle flame would illuminate the entire chamber like a starlit sky.',
    narrationUr:
      'Yeh hai Sheesh Mahal, yani Aayinon ka Mahal, jo Badshah Shah Jahan ne 1631 mein tameer karwaya. Is ki chhat aur deewaron par hazaron chhotay sheeshay lagaye gaye hain. Raat ke waqt sirf aik shama jalaane se poora mahal sitaron ki tarah chamak uthta tha.',
  },
  {
    id: 'diwan-e-aam',
    module: 'lahore-fort',
    name: 'Diwan-e-Aam',
    localName: 'دیوانِ عام',
    era: '1628 CE · 40-Pillar Audience Hall',
    category: 'Hall of Public Audience',
    summary:
      'A sweeping red sandstone colonnade supported by forty carved pillars where the Mughal emperor heard petitions from citizens in the open courtyard.',
    highlight: 'Elevated marble Jharokha-e-Darshan throne balcony above 40 pillars',
    position: [0, 3.0, -0.3],
    guideSpot: [-1.9, 0, 1.5],
    cameraPos: [0.4, 3.8, 7.4],
    cameraTarget: [0, 3.0, -0.6],
    narrationEn:
      'This forty-pillar red sandstone pavilion is the Diwan-e-Aam, the Hall of Public Audience. Each morning, the emperor appeared on the elevated white marble Jharokha balcony at its center while ministers, envoys, and common citizens gathered across the courtyard below to present petitions.',
    narrationUr:
      'Yeh chalis sutoonon wala Diwan-e-Aam hai, jahan Mughal badshah aam awam ki faryad sunte thay. Samne ooncha safed sang-e-marmar ka Jharokha hai jahan badshah tashreef rakhte thay aur neeche sehan mein log apni darkhwasten pesh karte thay.',
  },
  {
    id: 'naulakha-pavilion',
    module: 'lahore-fort',
    name: 'Naulakha Pavilion',
    localName: 'نولکھا محل',
    era: '1633 CE · Pietra Dura Marble',
    category: 'Royal Pavilion',
    summary:
      'Famous for its graceful curved Bengali-style roof and delicate semi-precious stone inlay, traditionally said to have cost nine lakh rupees.',
    highlight: 'Curved Bangaldar marble canopy inlaid with lapis, agate & carnelian',
    position: [2.7, 2.2, -0.3],
    guideSpot: [1.3, 0, 1.6],
    cameraPos: [4.6, 3.0, 6.4],
    cameraTarget: [2.7, 2.4, -0.6],
    narrationEn:
      'Behold the Naulakha Pavilion, built in 1633 along the western terrace of the Shah Burj. Its distinctive curved Bangaldar roof was inspired by Bengal architecture, and its white marble columns feature microscopic pietra dura floral inlays crafted with lapis lazuli and carnelian.',
    narrationUr:
      'Yeh khoobsurat chhoti baradari Naulakha Pavilion kehlati hai, jo 1633 mein banai gayi. Is ki mudi hui Bengali chhat aur sang-e-marmar par qeemti patharon ki minakari isay poore Lahore Fort ka sab se nazuk shahkar banati hai.',
  },
  {
    id: 'picture-wall',
    module: 'lahore-fort',
    name: 'Picture Wall & Hathi Pol',
    localName: 'تصویری دیوار',
    era: '1624 CE · Jahangir & Shah Jahan',
    category: 'Glazed Tile Mural',
    summary:
      'The world’s largest continuous glazed tile mosaic facade, depicting polo players, royal elephants, mythical dragons, and floral arabesques.',
    highlight: 'Hand-glazed Kashi tile panels stretching across the northern fortification',
    position: [-3.3, 0.8, -0.3],
    guideSpot: [-2.0, 0, 1.8],
    cameraPos: [-5.4, 2.2, 5.6],
    cameraTarget: [-3.3, 1.2, -0.6],
    narrationEn:
      'Spanning the northern and western fortification walls is the iconic Picture Wall alongside Hathi Pol, the Elephant Gate. Commissioned under Emperor Jahangir and completed by Shah Jahan, thousands of glazed Kashi tiles illustrate royal elephant processions, polo matches, and Persian floral motifs.',
    narrationUr:
      'Yeh Lahore Fort ki mashhoor Tasweeri Deewar aur Hathi Pol hai. Jahangir ke daur mein shuru hone wali is deewar par rang-birangi Kashi tiles se hathi sawari, polo ke khiladi aur Mughal naqsh-o-nigar banaye gaye hain.',
  },
  {
    id: 'moti-masjid',
    module: 'lahore-fort',
    name: 'Moti Masjid',
    localName: 'موتی مسجد',
    era: '1635 CE · Makrana Marble',
    category: 'Pearl Mosque',
    summary:
      'An intimate triple-domed mosque carved entirely from luminous white Makrana marble, reserved for the royal Mughal household.',
    highlight: 'Three fluted onion domes with gilded finials & serene marble courtyard',
    position: [3.3, 0.8, -0.3],
    guideSpot: [2.0, 0, 1.8],
    cameraPos: [5.4, 2.2, 5.6],
    cameraTarget: [3.3, 1.2, -0.6],
    narrationEn:
      'On the eastern edge stands Moti Masjid, the Pearl Mosque, built around 1635 from pure white Makrana marble. Its three bulbous domes and five-arched prayer hall gleam softly under the sun, offering a tranquil sanctuary tucked beside the royal quarters.',
    narrationUr:
      'Mashriqi hissay mein yeh khalis safed sang-e-marmar ki Moti Masjid hai, jisay 1635 ke qareeb tameer kiya gaya. Is ke teen moti jaisay gumbad aur pur-sukoon sehan shahi khandan ki ibadat ke liye makhsoos thay.',
  },
];

export const JAPANESE_PAVILION_STOPS: TourStop[] = [
  {
    id: 'character-intro',
    module: 'japanese-pavilion',
    name: 'Kenji · Heritage Storyteller',
    localName: '健二 · 案内人',
    era: 'Edo Tradition · 3D Narrator',
    category: '3D Character Model',
    summary:
      'Standing before his ancestral wooden residence, Kenji introduces the architecture, seasonal garden customs, and hospitality of a classic Kyoto machiya.',
    highlight: 'Articulated kimono & hakama figure with synchronized voice-over',
    position: [0, 1.1, 0.8],
    guideSpot: [0, 0, 0.8],
    cameraPos: [0, 1.9, 6.6],
    cameraTarget: [0, 0.5, -0.6],
    narrationEn:
      'Konnichiwa, and welcome to my family’s traditional wooden residence. I am Kenji, your 3D cultural guide. Behind me stands our Edo-style machiya home, built from fragrant Japanese cedar without a single iron nail, overlooking a quiet stone and cherry-blossom garden.',
    narrationJa:
      'こんにちは、ようこそ我が家へ。私は案内人の健二です。後ろに見えるのが、杉の木と障子で作られた伝統的な京都の町家です。静かな石庭と桜とともに、日本の暮らしをご紹介します。',
    narrationUr:
      'Konnichiwa! Mera naam Kenji hai aur main aap ka Japanese 3D guide hoon. Mere peechay mera rawayati Japanese ghar hai jo cedar ki lakri, shoji darwazon aur sukoon bakhsh zen garden ke sath banaya gaya hai.',
  },
  {
    id: 'house-overview',
    module: 'japanese-pavilion',
    name: 'Machiya Cedar Residence',
    localName: '町家 · 伝統建築',
    era: 'Edo Period · Irimoya Roof',
    category: 'Traditional House',
    summary:
      'Positioned directly behind the guide, the two-tier house features interlocking timber joinery, dark ceramic kawara roof tiles, and an inviting noren entrance.',
    highlight: 'Curved kawara-tiled hip-and-gable roof & warm interior lantern glow',
    position: [0, 2.0, -3.6],
    guideSpot: [0, 0, 0.8],
    cameraPos: [4.6, 2.8, 7.4],
    cameraTarget: [0, 0.9, -2.8],
    narrationEn:
      'Look closely at the traditional house behind me. Its sweeping irimoya roof is tiled with dark ceramic kawara to channel monsoon rain away from the cedar beams. Warm paper lanterns glow softly inside, visible through the translucent shoji lattice screens.',
    narrationJa:
      '後ろの町家をご覧ください。緩やかな入母屋造りの屋根には黒い瓦が葺かれ、雨から木の柱を守ります。格子戸の奥からは、和紙の行灯の温かい光が漏れています。',
    narrationUr:
      'Mere peechay yeh traditional Japanese ghar dekhein. Is ki khubsurat mudi hui chhat gehray rang ki kawara tiles se bani hai aur andar jalte hue kaghazi laltain shoji screens ke peechay se roshni bikher rahe hain.',
  },
  {
    id: 'engawa-shoji',
    module: 'japanese-pavilion',
    name: 'Engawa & Shoji Veranda',
    localName: '縁側と障子',
    era: 'Indoor-Outdoor Threshold',
    category: 'Timber Architecture',
    summary:
      'A raised polished cedar veranda connecting the tatami interior to the garden, shaded by deep eaves and framed by hand-crafted kumiko lattice doors.',
    highlight: 'Raised cedar veranda deck, stone steps & translucent washi screens',
    position: [-1.4, 0.9, -2.0],
    guideSpot: [0, 0, 0.8],
    cameraPos: [-3.8, 2.0, 3.6],
    cameraTarget: [-0.8, 0.4, -2.0],
    narrationEn:
      'This raised wooden porch along the front of the house is the engawa. Families sit here on cool evenings sipping green tea, listening to wind chimes while admiring the moss garden. Notice how the sliding shoji panels diffuse sunlight gently into the living room.',
    narrationJa:
      '家の正面にある木の廊下が縁側です。夕暮れにはここでお茶を飲みながら庭を眺めます。障子の和紙が外の光を優しく室内へ届けます。',
    narrationUr:
      'Ghar ke samne yeh lakri ka baramda Engawa kehlata hai. Yahan baith kar sham ko sabz chai peete hue baghicha dekha jata hai, aur shoji ke darwazay suraj ki roshni ko naram bana kar andar bhejte hain.',
  },
];

export const ALL_STOPS_BY_MODULE: Record<ModuleId, TourStop[]> = {
  'lahore-fort': LAHORE_FORT_STOPS,
  'japanese-pavilion': JAPANESE_PAVILION_STOPS,
};