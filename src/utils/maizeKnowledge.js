export const HEALTHY_LABELS = new Set(["Healthy leaf"]);
export const INVALID_LABELS = new Set(["invalid"]);
export const SUPPORTED_LABELS = new Set([
  "Healthy leaf",
  "Common_rust",
  "Northern leaf Blight",
  "Gray_leaf_spot",
]);

const portalSources = {
  leafBlight: {
    label: "TNAU Agritech Portal: Leaf Blight",
    url: "https://agritech.tnau.ac.in/crop_protection/maize_disease_new/maize_2.html",
  },
  turcicum: {
    label: "TNAU Agritech Portal: Turcicum Leaf Blight",
    url: "https://agritech.tnau.ac.in/crop_protection/maize_disease/maize_4.html",
  },
  rust: {
    label: "TNAU Agritech Portal: Common Rust",
    url: "https://agritech.tnau.ac.in/crop_protection/maize_disease_new/maize_4.html",
  },
  fallArmyworm: {
    label: "TNAU Agritech Portal: Fall Armyworm",
    url: "https://agritech.tnau.ac.in/crop_protection/maize/crop_prot_maize_fall_armyworm.html",
  },
  stemBorer: {
    label: "TNAU Agritech Portal: Stem Borer",
    url: "https://agritech.tnau.ac.in/crop_protection/maize/crop_prot_maize_2.html",
  },
};

const diagnosisMap = {
  "Healthy leaf": {
    severity: "Healthy / no major visible stress",
    description: "The uploaded maize leaf appears healthy based on the current local model.",
    fieldNote: "Continue routine scouting and keep checking lower and middle canopy leaves every few days.",
    recommendations: [
      "No fungicide spray is suggested from this prediction.",
      "Continue regular field scouting, especially lower leaves where leaf blight symptoms may begin.",
      "Keep the field clean and remove infected residues if disease symptoms appear later.",
    ],
    sources: [portalSources.leafBlight],
  },
  Blight: {
    severity: "Moderate foliar disease risk",
    description: "General blight symptoms are likely, with drying or elongated lesions across the leaf blade.",
    fieldNote: "Field sanitation and timely fungicidal protection matter most when lesions are expanding quickly.",
    recommendations: [
      "Remove or destroy heavily infected leaf debris and stubbles after harvest.",
      "Spray mancozeb or zineb at 2-4 g/l, or propiconazole 25% EC at 1 ml/l, following Agritech guidance.",
      "Scout the field again after 7-10 days to confirm whether lesion spread has slowed.",
    ],
    sources: [portalSources.leafBlight, portalSources.turcicum],
  },
  "Northern leaf Blight": {
    severity: "High if spreading near tasseling or silking",
    description: "Long cigar-shaped gray-green to tan lesions are consistent with northern leaf blight or turcicum blight.",
    fieldNote: "This disease can become economically important when infection reaches upper leaves near reproductive stages.",
    recommendations: [
      "Burn or bury infected maize stubbles to reduce carry-over inoculum.",
      "Spray mancozeb or zineb at 2-4 g/litre at around 10-day interval after first appearance.",
      "Propiconazole 25% EC at 0.1% can be used around 35 and 50 DAS where recommended locally.",
    ],
    sources: [portalSources.turcicum, portalSources.leafBlight],
  },
  Phaeosphaeia_leaf_spot: {
    severity: "Localized leaf spot stress",
    description: "Leaf spot-like lesions are likely; these often begin as discrete spots before coalescing into broader damaged patches.",
    fieldNote: "Early field hygiene and quick monitoring help prevent a small spotting problem from spreading over the canopy.",
    recommendations: [
      "Remove severely affected leaves where practical and avoid leaving infected residue in the field.",
      "Improve field aeration and avoid prolonged leaf wetness where possible.",
      "Consult local extension guidance if lesions expand fast and fungicidal support is needed.",
    ],
    sources: [portalSources.leafBlight],
  },
  Southern_rust: {
    severity: "Rust pressure developing",
    description: "The model suggests a rust-type infection with pustule-like activity on the leaf surface.",
    fieldNote: "Rust can spread rapidly under moist conditions, so repeat scouting is important.",
    recommendations: [
      "Remove alternate host weeds and reduce volunteer maize where possible.",
      "Use tebuconazole at 1 ml/l or mancozeb/chlorothalonil as indicated in Agritech rust guidance.",
      "Inspect both leaf surfaces because pustules may be scattered and easy to miss early.",
    ],
    sources: [portalSources.rust],
  },
  Gray_leaf_spot: {
    severity: "Moderate gray leaf spot risk",
    description: "Gray leaf spot symptoms are likely, especially where rectangular or elongated gray lesions appear between veins.",
    fieldNote: "Extended humidity and retained residue can increase disease carry-over and lesion density.",
    recommendations: [
      "Remove and destroy infected plant residues to reduce carry-over inoculum.",
      "Avoid dense crop canopy where possible and improve field airflow because high humidity favours leaf spot development.",
      "For Cercospora-type leaf spots, TNAU Agritech commonly lists mancozeb/carbendazim-type sprays at disease initiation; follow local maize advisory before spraying.",
    ],
    sources: [portalSources.leafBlight],
  },
  Common_rust: {
    severity: "Rust infection likely",
    description: "Circular to elongated cinnamon-brown pustules are consistent with common rust in maize.",
    fieldNote: "Moist and cool-to-warm conditions can favor fast spread across the field.",
    recommendations: [
      "Remove alternate hosts around the field where possible.",
      "Collect crop remains and destroy them by burning or burying.",
      "Foliar spray kresoxim-methyl 44.3% SC at 1 ml/l or tebuconazole at 1 ml/l; chlorothalonil or mancozeb may also be used as listed by TNAU Agritech.",
    ],
    sources: [portalSources.rust],
  },
  Fallarmy_worm: {
    severity: "High pest pressure if whorl feeding is active",
    description: "Whorl feeding, scraping, and irregular defoliation are consistent with fall armyworm injury.",
    fieldNote: "Early-stage detection matters because larvae hide in the central whorl and damage expands quickly.",
    recommendations: [
      "Install pheromone traps at 12 per hectare and monitor fresh whorl damage.",
      "Use azadirachtin 1500 ppm at 2.5 l/ha or chlorantraniliprole 18.5 SC at 200 ml/ha during early stage, as listed by Agritech.",
      "At late whorl stage, consider Metarhizium anisopliae or emamectin benzoate 5 SG at 200 g/ha depending on infestation level.",
    ],
    sources: [portalSources.fallArmyworm],
  },
  Herbicide_Burn: {
    severity: "Chemical or spray injury stress",
    description: "The image pattern suggests herbicide or chemical burn rather than a classic infectious disease.",
    fieldNote: "Check recent spray history, dose, drift risk, and weather conditions during application.",
    recommendations: [
      "Review herbicide rate, nozzle pattern, and nearby drift source immediately.",
      "Avoid repeat application until fresh symptom spread is understood.",
      "Support crop recovery through irrigation and balanced nutrition where feasible.",
    ],
    sources: [portalSources.leafBlight],
  },
  Ear_Rot: {
    severity: "Ear or grain quality risk",
    description: "The model suggests ear rot-like stress, which can reduce grain quality and storage safety.",
    fieldNote: "Inspect cobs directly and separate visibly affected ears before storage.",
    recommendations: [
      "Harvest affected cobs separately and avoid storing visibly rotted ears with healthy produce.",
      "Dry grain promptly and keep storage conditions clean and low in moisture.",
      "Review field sanitation and insect injury because ear damage often increases rot entry points.",
    ],
    sources: [portalSources.leafBlight],
  },
  Stem_borer: {
    severity: "Stem damage risk",
    description: "Shot holes, dead heart, or internal boring patterns can align with stem borer attack.",
    fieldNote: "Stem borer injury often starts in young leaves before progressing to internal stem feeding.",
    recommendations: [
      "Intercrop maize with cowpea in 2:1 ratio where feasible.",
      "Release Trichogramma chilonis at 2,50,000 per hectare weekly for three rounds, following Agritech guidance.",
      "When infestation crosses 10%, spray chlorantraniliprole 18.5 SC at 150 ml/ha or equivalent recommended treatment.",
    ],
    sources: [portalSources.stemBorer],
  },
  Pottasium_deficiency: {
    severity: "Nutrient stress",
    description: "The leaf pattern suggests potassium deficiency, often seen as marginal scorching or weak plant vigor.",
    fieldNote: "Verify with soil test or agronomy record before applying corrective doses.",
    recommendations: [
      "Confirm deficiency with field history or nutrient testing before correction.",
      "Adjust potash application in the next nutrient schedule based on agronomic recommendation.",
      "Monitor leaf margins and stalk strength for further deterioration.",
    ],
    sources: [portalSources.leafBlight],
  },
  Phosphorous_deficiency: {
    severity: "Nutrient stress",
    description: "The image suggests phosphorus-related stress that can suppress early growth and root development.",
    fieldNote: "Phosphorus deficiency is best confirmed with soil status and crop stage information.",
    recommendations: [
      "Review basal fertilizer application and soil phosphorus availability.",
      "Correct the nutrient schedule using local agronomy recommendation rather than blind spraying.",
      "Track plant vigor and root-zone moisture because uptake can fall in stressed soil.",
    ],
    sources: [portalSources.leafBlight],
  },
  Nitrogen_deficiency: {
    severity: "Nutrient stress",
    description: "Yellowing consistent with nitrogen stress is likely, especially if older leaves are paling first.",
    fieldNote: "Nitrogen stress can resemble disease from a distance, so field context is important.",
    recommendations: [
      "Check whether lower leaves are uniformly yellowing from tip toward midrib.",
      "Review split nitrogen schedule and correct only with crop-stage-appropriate dose.",
      "Avoid overcorrection because excess nitrogen can worsen disease susceptibility later.",
    ],
    sources: [portalSources.leafBlight],
  },
  Magnesium_deficiency: {
    severity: "Secondary nutrient stress",
    description: "The uploaded pattern suggests magnesium-related chlorosis or interveinal stress.",
    fieldNote: "Interveinal yellowing should be verified with agronomic context before treatment.",
    recommendations: [
      "Check whether symptoms are stronger between veins than on the veins themselves.",
      "Review magnesium status in the field nutrient program and apply correction only if confirmed.",
      "Track whether new leaves stay green after correction.",
    ],
    sources: [portalSources.leafBlight],
  },
  Maize_streak: {
    severity: "Virus-like symptom risk",
    description: "Streak-like chlorotic pattern may indicate viral or vector-associated stress in maize.",
    fieldNote: "Vector control and clean field hygiene are usually more effective than late curative action.",
    recommendations: [
      "Inspect nearby plants for repeating streak pattern and remove severely affected plants where practical.",
      "Monitor possible vector presence and control alternate host weeds around the field.",
      "Consult local extension support if large field sections show similar striped symptoms.",
    ],
    sources: [portalSources.leafBlight],
  },
  Stalk_borer: {
    severity: "Internal stem injury risk",
    description: "The model suggests stalk borer-type injury affecting internal tissues and plant vigor.",
    fieldNote: "Internal boring often reduces nutrient flow and can lead to wilting or lodging later.",
    recommendations: [
      "Inspect for bore holes, frass, and dead heart symptoms in young plants.",
      "Use the same integrated monitoring logic recommended for maize stem borer management.",
      "Take quick action when damage level crosses economic threshold in the field.",
    ],
    sources: [portalSources.stemBorer],
  },
  invalid: {
    severity: "Image quality issue",
    description: "The model could not confidently recognize the sample as a valid maize leaf image.",
    fieldNote: "Try again with one clear leaf, plain background, and better focus.",
    recommendations: [
      "Retake the photo with the leaf filling most of the frame.",
      "Avoid blur, shade-heavy images, or too much background soil and sky.",
      "Capture the most affected part of the crop for better disease localization.",
    ],
    sources: [portalSources.leafBlight],
  },
};

export function labelDisplayName(label) {
  if (label === "Gray_leaf_spot") {
    return "Cercospora / Gray leaf spot";
  }

  return label.replaceAll("_", " ");
}

export function getDiagnosisInfo(label) {
  return diagnosisMap[label] ?? diagnosisMap.invalid;
}
