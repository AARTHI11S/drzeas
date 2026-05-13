from __future__ import annotations

HEALTHY_LABELS = {"Healthy leaf"}
INVALID_LABELS = {"invalid"}
SUPPORTED_LABELS = {
    "Healthy leaf",
    "Common_rust",
    "Northern leaf Blight",
    "Gray_leaf_spot",
}

PORTAL_SOURCES = {
    "leaf_blight": {
        "label": "TNAU Agritech Portal: Leaf Blight",
        "url": "https://agritech.tnau.ac.in/crop_protection/maize_disease_new/maize_2.html",
    },
    "turcicum": {
        "label": "TNAU Agritech Portal: Turcicum Leaf Blight",
        "url": "https://agritech.tnau.ac.in/crop_protection/maize_disease/maize_4.html",
    },
    "rust": {
        "label": "TNAU Agritech Portal: Common Rust",
        "url": "https://agritech.tnau.ac.in/crop_protection/maize_disease_new/maize_4.html",
    },
    "fall_armyworm": {
        "label": "TNAU Agritech Portal: Fall Armyworm",
        "url": "https://agritech.tnau.ac.in/crop_protection/maize/crop_prot_maize_fall_armyworm.html",
    },
    "stem_borer": {
        "label": "TNAU Agritech Portal: Stem Borer",
        "url": "https://agritech.tnau.ac.in/crop_protection/maize/crop_prot_maize_2.html",
    },
}


DEFAULT_INFO = {
    "severity": "Needs field verification",
    "description": "The model returned a class that does not yet have a detailed agronomy note in the project map.",
    "field_note": "Verify symptoms in the field and extend the recommendation map for this label before production use.",
    "recommendations": [
        "Confirm the class label against actual field symptoms.",
        "Cross-check crop stage, symptom spread, and recent weather before acting.",
        "Update the project recommendation map for this class.",
    ],
    "sources": [PORTAL_SOURCES["leaf_blight"]],
}


DIAGNOSIS_MAP = {
    "Healthy leaf": {
        "severity": "Healthy / no major visible stress",
        "description": "The uploaded maize leaf appears healthy based on the trained classifier.",
        "field_note": "Continue routine scouting and monitor lower and middle canopy leaves regularly.",
        "recommendations": [
            "No fungicide spray is suggested from this prediction.",
            "Continue regular field scouting, especially lower leaves where leaf blight symptoms may begin.",
            "Keep the field clean and remove infected residues if disease symptoms appear later.",
        ],
        "sources": [PORTAL_SOURCES["leaf_blight"]],
    },
    "Blight": {
        "severity": "Moderate foliar disease risk",
        "description": "General blight symptoms are likely, with elongated lesions and drying tissue across the leaf blade.",
        "field_note": "Act early if lesions are expanding quickly or moving onto upper canopy leaves.",
        "recommendations": [
            "Remove heavily infected crop residue after harvest.",
            "Follow local agronomy guidance for suitable fungicidal protection such as mancozeb-based sprays.",
            "Rescout after 7 to 10 days to check whether lesion spread has slowed.",
        ],
        "sources": [PORTAL_SOURCES["leaf_blight"], PORTAL_SOURCES["turcicum"]],
    },
    "Northern leaf Blight": {
        "severity": "High if spreading near tasseling or silking",
        "description": "Long cigar-shaped lesions are consistent with northern leaf blight or turcicum blight.",
        "field_note": "Yield impact is greater when upper leaves become infected near reproductive stages.",
        "recommendations": [
            "Burn or bury infected maize stubbles to reduce carry-over inoculum.",
            "Spray mancozeb or zineb at 2-4 g/litre after disease appearance and repeat at 10-day interval if needed.",
            "Propiconazole 25% EC at 0.1% can be used around 35 and 50 DAS where recommended locally.",
        ],
        "sources": [PORTAL_SOURCES["turcicum"], PORTAL_SOURCES["leaf_blight"]],
    },
    "Southern_rust": {
        "severity": "Rust pressure developing",
        "description": "The model suggests a rust-type infection with pustule-like activity on the leaf surface.",
        "field_note": "Repeat scouting is important because rust can spread rapidly under favorable conditions.",
        "recommendations": [
            "Reduce volunteer maize and alternate host weeds where feasible.",
            "Use a locally recommended triazole or protective fungicide where warranted.",
            "Inspect both leaf surfaces because pustules may be scattered early.",
        ],
        "sources": [PORTAL_SOURCES["rust"]],
    },
    "Common_rust": {
        "severity": "Rust infection likely",
        "description": "Circular to elongated brown pustules are consistent with common rust in maize.",
        "field_note": "Spread is often favored by moist weather and susceptible crop stages.",
        "recommendations": [
            "Remove alternate hosts around the field where possible.",
            "Collect crop remains and destroy them by burning or burying.",
            "Foliar spray kresoxim-methyl 44.3% SC at 1 ml/l or tebuconazole at 1 ml/l; chlorothalonil or mancozeb may also be used as listed by TNAU Agritech.",
        ],
        "sources": [PORTAL_SOURCES["rust"]],
    },
    "Gray_leaf_spot": {
        "severity": "Moderate gray leaf spot risk",
        "description": "Rectangular or elongated gray lesions between veins suggest gray leaf spot.",
        "field_note": "Retained residue and prolonged humidity can intensify the problem.",
        "recommendations": [
            "Remove and destroy infected plant residues to reduce carry-over inoculum.",
            "Avoid dense crop canopy where possible and improve field airflow because high humidity favours leaf spot development.",
            "For Cercospora-type leaf spots, TNAU Agritech commonly lists mancozeb/carbendazim-type sprays at disease initiation; follow local maize advisory before spraying.",
        ],
        "sources": [PORTAL_SOURCES["leaf_blight"]],
    },
    "Fallarmy_worm": {
        "severity": "High pest pressure if whorl feeding is active",
        "description": "Whorl feeding and irregular defoliation are consistent with fall armyworm injury.",
        "field_note": "Early detection matters because larvae often hide in the central whorl.",
        "recommendations": [
            "Monitor fresh whorl damage and pheromone trap catches.",
            "Use recommended biocontrol or insecticidal options based on infestation stage.",
            "Act quickly before larvae move deeper into the whorl.",
        ],
        "sources": [PORTAL_SOURCES["fall_armyworm"]],
    },
    "Stem_borer": {
        "severity": "Stem damage risk",
        "description": "Shot holes, dead heart, or internal boring patterns can align with stem borer attack.",
        "field_note": "Damage often begins in younger leaves before progressing internally.",
        "recommendations": [
            "Inspect for dead heart, frass, and stem entry holes.",
            "Use integrated control such as monitoring, biocontrol release, and threshold-based spraying.",
            "Act early in young crop stages when intervention is most effective.",
        ],
        "sources": [PORTAL_SOURCES["stem_borer"]],
    },
    "Stalk_borer": {
        "severity": "Internal stem injury risk",
        "description": "The model suggests internal borer injury affecting stem tissues and plant vigor.",
        "field_note": "Internal boring can reduce nutrient flow and increase lodging risk later.",
        "recommendations": [
            "Inspect for bore holes, frass, and plant wilting.",
            "Use the same integrated logic recommended for stem borer management.",
            "Take action when field damage crosses threshold levels.",
        ],
        "sources": [PORTAL_SOURCES["stem_borer"]],
    },
    "invalid": {
        "severity": "Image quality issue",
        "description": "The sample is not clear enough for reliable maize-leaf analysis.",
        "field_note": "Use one clear close-up leaf image with better lighting and less background clutter.",
        "recommendations": [
            "Retake the photo with the leaf filling most of the frame.",
            "Avoid blur, heavy shadows, or too much soil and sky in the image.",
            "Capture the most affected part of the leaf for better localization.",
        ],
        "sources": [PORTAL_SOURCES["leaf_blight"]],
    },
}


def label_display_name(label: str) -> str:
    if label == "Gray_leaf_spot":
        return "Cercospora / Gray leaf spot"
    return label.replace("_", " ")


def get_diagnosis_info(label: str) -> dict:
    return DIAGNOSIS_MAP.get(label, DEFAULT_INFO)
